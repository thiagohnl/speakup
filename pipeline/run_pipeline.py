"""
Master pipeline runner.
Runs all three steps in order and reports timing.

Usage:
  python pipeline/run_pipeline.py           # full run (steps 1, 2, 3)
  python pipeline/run_pipeline.py --resume  # re-extract only (step 3)
"""
import argparse
import subprocess
import sys
import time
from pathlib import Path

PIPELINE_DIR = Path(__file__).parent
STEPS = [
    ('Fetch Channel Videos', PIPELINE_DIR / 'execution' / 'fetch_channel_videos.py'),
    ('Fetch Transcripts',    PIPELINE_DIR / 'execution' / 'fetch_transcripts.py'),
    ('Extract Insights',     PIPELINE_DIR / 'execution' / 'extract_insights.py'),
]


def run_step(step_number: int, name: str, script: Path) -> bool:
    print(f'\n--- Step {step_number}: {name} ---')
    start = time.time()
    result = subprocess.run([sys.executable, str(script)])
    elapsed = time.time() - start
    if result.returncode != 0:
        print(f'\nERROR: Step {step_number} ({name}) failed with exit code {result.returncode}')
        return False
    print(f'--- Step {step_number} complete ({elapsed:.1f}s) ---')
    return True


def main():
    parser = argparse.ArgumentParser(description='Vinh Giang content pipeline')
    parser.add_argument('--resume', action='store_true',
                        help='Skip steps 1 & 2, only re-run extract_insights (step 3)')
    args = parser.parse_args()

    total_start = time.time()

    if args.resume:
        steps_to_run = [(3, *STEPS[2])]
    else:
        steps_to_run = [(i + 1, name, script) for i, (name, script) in enumerate(STEPS)]

    for step_num, name, script in steps_to_run:
        if not run_step(step_num, name, script):
            sys.exit(1)

    total_elapsed = time.time() - total_start
    minutes, seconds = divmod(int(total_elapsed), 60)
    print(f'\nTotal time: {minutes}m {seconds}s')
    print('Pipeline complete. data/vinh_giang.json is ready to import into SpeakUp.')


if __name__ == '__main__':
    main()
