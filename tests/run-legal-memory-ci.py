"""GitHub Ubuntu host observer; records peaks even if a container process is OOM-killed."""
import json
import os
from pathlib import Path
import subprocess
import sys
import time

LIMIT=512*1024*1024
SAFE=448*1024*1024
RESULTS=Path('memory-results').resolve()

def docker(*args):
    return subprocess.check_output(['docker',*args],text=True).strip()

def verdict(harness, state, peak, oom, cap, timed_out):
    return bool(harness and state.get('ExitCode')==0 and not state.get('OOMKilled') and not timed_out and oom==0 and cap and peak and peak<=SAFE and harness.get('memory_acceptance') is True and harness.get('completed_flows')==14 and harness.get('corpus_chunks')==6804 and harness.get('retrieved_reference_chunks')==12)

def main():
    if sys.platform!='linux': raise SystemExit('Requires the GitHub Ubuntu host.')
    RESULTS.mkdir(exist_ok=True)
    cid=docker('create','--memory=512m','--memory-swap=512m','--cpus=1','--network=none','--cgroupns=private','--env','MEMORY_RESULTS_DIR=/results','--mount','type=bind,src='+str(RESULTS)+',dst=/results','tnt-legal-memory')
    flow_peaks={};peak=0;oom=0;verified=False;timed_out=False;harness={};state={};sample_errors=[]
    try:
        docker('start',cid)
        deadline=time.monotonic()+1200
        while True:
            info=json.loads(docker('inspect',cid))[0]
            state=info['State']
            pid=state.get('Pid',0)
            if pid:
                try:
                    entry=next(line.split(':',2)[2] for line in Path(f'/proc/{pid}/cgroup').read_text().splitlines() if line.startswith('0::'))
                    cg=Path('/sys/fs/cgroup')/entry.lstrip('/')
                    maximum=(cg/'memory.max').read_text().strip()
                    swap=(cg/'memory.swap.max').read_text().strip()
                    verified=verified or (maximum==str(LIMIT) and swap=='0' and info['HostConfig']['Memory']==LIMIT and info['HostConfig']['MemorySwap']==LIMIT and info['HostConfig']['NetworkMode']=='none')
                    peak=max(peak,int((cg/'memory.peak').read_text()))
                    current=int((cg/'memory.current').read_text())
                    try:
                        phase=json.loads((RESULTS/'progress.json').read_text()).get('current_test')
                        if phase: flow_peaks[phase]=max(flow_peaks.get(phase,0),current)
                    except (OSError,ValueError): pass
                    events=dict(line.split() for line in (cg/'memory.events').read_text().splitlines())
                    oom=max(oom,int(events['oom_kill']))
                except (OSError,StopIteration,ValueError) as error:
                    if len(sample_errors)<3: sample_errors.append(type(error).__name__+': '+str(error))
            if not state['Running']: break
            if time.monotonic()>deadline:
                timed_out=True
                docker('stop','--time','10',cid)
                state=json.loads(docker('inspect',cid))[0]['State']
                break
            time.sleep(.1)
        log=subprocess.run(['docker','logs',cid],capture_output=True,text=True)
        (RESULTS/'container.log').write_text(log.stdout+'\n'+log.stderr)
        evidence=RESULTS/'harness.json'
        if evidence.exists():
            harness=json.loads(evidence.read_text())
            peak=max(peak,int(harness.get('peak_bytes',0)))
            oom=max(oom,int(harness.get('oom_kills',0)))
        progress=json.loads((RESULTS/'progress.json').read_text()) if (RESULTS/'progress.json').exists() else {}
        passed=verdict(harness,state,peak,oom,verified,timed_out)
        report={'sampled_flow_peaks_MiB':{k:round(v/1048576,2) for k,v in flow_peaks.items()},'status':'PASS' if passed else 'FAIL','peak_bytes':peak or None,'peak_MiB':round(peak/1048576,2) if peak else None,'limit_MiB':512,'safety_threshold_MiB':448,'headroom_MiB':round((LIMIT-peak)/1048576,2) if peak else None,'hard_cap_and_no_swap_verified':verified,'oom_kills_observed':oom,'container_oom_killed':state.get('OOMKilled'),'exit_code':state.get('ExitCode'),'timed_out':timed_out,'completed_flows':harness.get('completed_flows',len(progress.get('passed',[]))),'failed_test':progress.get('current_test'),'corpus_chunks':harness.get('corpus_chunks'),'retrieved_reference_chunks':harness.get('retrieved_reference_chunks'),'providers':'loopback synthetic only; real corpus, SDK serialization and PDF processing','observer_errors':sample_errors}
        (RESULTS/'result.json').write_text(json.dumps(report,indent=2))
        summary=f"## Legal AI memory test: {report['status']}\n\nPeak: {report['peak_MiB']} MiB; hard limit: 512 MiB; safety threshold: 448 MiB.\n\nCompleted flows: {report['completed_flows']}/14; corpus chunks: {report['corpus_chunks']}; OOM kills: {oom}; container exit: {report['exit_code']}.\n\nSynthetic documents and loopback provider responses only. No production services or credentials used. Full evidence is attached as a three-day artifact.\n"
        (RESULTS/'summary.md').write_text(summary)
        print(json.dumps(report,indent=2),flush=True)
        return 0 if passed else 1
    finally:
        subprocess.run(['docker','rm','--force',cid],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

if __name__=='__main__': sys.exit(main())
