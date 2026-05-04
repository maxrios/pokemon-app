import asyncio
import logging
import random
from datetime import datetime, timezone

from database import get_redis_client
from models import BattleHistory, BattleTurn
from models import Pokemon

logger = logging.getLogger(__name__)

BATTLE_QUEUE_KEY = "battle_queue"
LOCK_TTL_SECONDS = 3
POLL_INTERVAL_SECONDS = 1

# Attacking type -> {defending type -> damage multiplier}
TYPE_CHART: dict[str, dict[str, float]] = {
    "fire": {"grass": 2.0, "ice": 2.0, "bug": 2.0},
    "water": {"fire": 2.0, "ground": 2.0, "rock": 2.0},
    "grass": {"water": 2.0, "ground": 2.0, "rock": 2.0},
    "electric": {"water": 2.0, "flying": 2.0},
}


def _type_multiplier(attacker_types: list[str], defender_types: list[str]) -> float:
    multiplier = 1.0
    for att in [t.lower() for t in attacker_types]:
        for def_ in [t.lower() for t in defender_types]:
            multiplier *= TYPE_CHART.get(att, {}).get(def_, 1.0)
    return multiplier


def _damage(attacker: Pokemon, defender: Pokemon) -> int:
    raw = attacker.attack - defender.defense + random.randint(1, 10)
    return max(1, int(raw * _type_multiplier(attacker.types, defender.types)))


def _winner_from_hp_replay(battle: BattleHistory) -> Pokemon:
    p1 = Pokemon.objects(id=battle.pokemon_one.id).first()
    p2 = Pokemon.objects(id=battle.pokemon_two.id).first()
    p1_hp, p2_hp = p1.hp, p2.hp
    for t in BattleTurn.objects(battle=battle).order_by("turn_number"):
        p1_hp -= t.damage_to_pokemon_one
        p2_hp -= t.damage_to_pokemon_two
    return p2 if p1_hp <= 0 else p1


def _finalize_battle(battle: BattleHistory, winner: Pokemon) -> None:
    battle.reload()
    battle.winner = winner
    battle.status = "completed"
    battle.ended_at = datetime.now(timezone.utc)
    battle.save()


def _process_battle(battle_id: str) -> None:
    redis = get_redis_client()
    if redis is None:
        return

    lock_key = f"battle_lock:{battle_id}"
    if not redis.set(lock_key, "1", ex=LOCK_TTL_SECONDS, nx=True):
        return  # Another worker claimed it

    try:
        battle = BattleHistory.objects(id=battle_id).first()
        if not battle or battle.status == "completed":
            redis.lrem(BATTLE_QUEUE_KEY, 1, battle_id)
            return

        battle.update(status="in_progress")

        last_turn = BattleTurn.objects(battle=battle).order_by("-turn_number").first()

        # Final turn already written but battle record not finalized (crash mid-finalize)
        if last_turn and last_turn.battle_over:
            winner = _winner_from_hp_replay(battle)
            _finalize_battle(battle, winner)
            redis.lrem(BATTLE_QUEUE_KEY, 1, battle_id)
            return

        p1 = Pokemon.objects(id=battle.pokemon_one.id).first()
        p2 = Pokemon.objects(id=battle.pokemon_two.id).first()

        # Replay stored turns to recover current HP
        p1_hp, p2_hp = p1.hp, p2.hp
        for t in BattleTurn.objects(battle=battle).order_by("turn_number"):
            p1_hp -= t.damage_to_pokemon_one
            p2_hp -= t.damage_to_pokemon_two

        next_turn_number = (last_turn.turn_number + 1) if last_turn else 1
        faster = p1 if p1.speed >= p2.speed else p2
        slower = p2 if faster is p1 else p1
        winner = None

        while True:
            redis.set(lock_key, "1", ex=LOCK_TTL_SECONDS)

            fast_dmg = _damage(faster, slower)
            slow_dmg = 0
            battle_over = False

            if faster is p1:
                p2_hp -= fast_dmg
                if p2_hp <= 0:
                    battle_over = True
                    winner = p1
                else:
                    slow_dmg = _damage(slower, faster)
                    p1_hp -= slow_dmg
                    if p1_hp <= 0:
                        battle_over = True
                        winner = p2
                dmg_to_p1, dmg_to_p2 = slow_dmg, fast_dmg
            else:
                p1_hp -= fast_dmg
                if p1_hp <= 0:
                    battle_over = True
                    winner = p2
                else:
                    slow_dmg = _damage(slower, faster)
                    p2_hp -= slow_dmg
                    if p2_hp <= 0:
                        battle_over = True
                        winner = p1
                dmg_to_p1, dmg_to_p2 = fast_dmg, slow_dmg

            BattleTurn(
                battle=battle,
                turn_number=next_turn_number,
                first_attacker=faster,
                damage_to_pokemon_one=dmg_to_p1,
                damage_to_pokemon_two=dmg_to_p2,
                battle_over=battle_over,
            ).save()

            if battle_over:
                break
            next_turn_number += 1

        _finalize_battle(battle, winner)
        redis.lrem(BATTLE_QUEUE_KEY, 1, battle_id)
        logger.info("Battle %s complete. Winner: %s", battle_id, winner.name)

    except Exception:
        logger.exception(
            "Error processing battle %s — lock will expire for retry", battle_id
        )


async def run_battle_worker() -> None:
    logger.info("Battle worker started")
    while True:
        try:
            redis = get_redis_client()
            if redis:
                raw = redis.lindex(BATTLE_QUEUE_KEY, 0)
                if raw:
                    await asyncio.to_thread(_process_battle, raw.decode())
        except Exception:
            logger.exception("Battle worker error")
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
