
export class AudioCore {
    ctx: AudioContext | null = null;
    master: GainNode | null = null;
    bgmBus: GainNode | null = null;
    sfxBus: GainNode | null = null;
    
    // Generative State
    isPlaying: boolean = false;
    isMuted: boolean = false;
    tempo: number = 90;
    nextNoteTime: number = 0;
    current16thNote: number = 0;
    timerID: number | null = null;
    
    // Composition State
    movement: 'INTRO' | 'MAIN' | 'BREAK' | 'CLIMAX' = 'INTRO';
    barCount: number = 0;
    theme: 'MAP' | 'SECTOR' | 'ETHOS' = 'MAP';
    
    // Chord Progressions (frequencies)
    // D Minor 9 / F Major 7 feel
    chords: number[][] = [
        [146.83, 220.00, 261.63, 349.23], // Dm7
        [130.81, 196.00, 246.94, 329.63], // Cmaj7
        [174.61, 261.63, 311.13, 392.00], // Fmaj7
        [110.00, 164.81, 220.00, 277.18]  // A7(b9)
    ];
    currentChordIndex: number = 0;

    init() {
        if (this.ctx) return;
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new Ctx();
        
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.6; // Slightly louder master
        
        // Master Bus Processing
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -12;
        comp.knee.value = 30;
        comp.ratio.value = 12;
        comp.attack.value = 0.003;
        comp.release.value = 0.25;
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
        
        this.bgmBus = this.ctx.createGain();
        this.bgmBus.gain.value = 0.5;
        this.bgmBus.connect(this.master);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.7;
        this.sfxBus.connect(this.master);
    }

    setScreenTheme(screen: 'map' | 'ethos' | string) {
        // Map logic to internal theme
        if (screen === 'map') {
            this.theme = 'MAP';
            this.tempo = 80;
            this.chords = [
                [146.83, 220.00, 261.63, 349.23], // Dm9
                [174.61, 261.63, 311.13, 392.00], // Fmaj7
            ]; 
        } else if (screen === 'ethos') {
            this.theme = 'ETHOS';
            this.tempo = 60; // Slow, grand
            this.chords = [
                [130.81, 196.00, 246.94, 329.63], // Cmaj7
                [174.61, 220.00, 261.63, 329.63], // Fmaj9
                [196.00, 246.94, 293.66, 392.00]  // G6
            ];
        } else {
            // Sector View (Action)
            this.theme = 'SECTOR';
            this.tempo = 120; // Driving
            this.chords = [
                [36.71, 73.42, 146.83], // Deep D drone
                [32.70, 65.41, 130.81], // Deep C drone
            ];
        }
        
        // Reset counters for smooth transition and prevent OOB index
        this.current16thNote = 0;
        this.currentChordIndex = 0;
    }

    toggleMute() {
        if (!this.master) return false;
        if (this.isMuted) {
            this.master.gain.setTargetAtTime(0.6, this.ctx!.currentTime, 0.1);
            this.isMuted = false;
        } else {
            this.master.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.1);
            this.isMuted = true;
        }
        return this.isMuted;
    }

    // --- SYNTHS ---

    private playSubBass(t: number, freq: number) {
        // Deep Sine Sub
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        
        // Grit Layer
        const osc2 = this.ctx!.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq, t); // Octave up? No, keep deep.

        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.8); // Long sustain
        
        const gritGain = this.ctx!.createGain();
        gritGain.gain.setValueAtTime(0.15, t); // Subtle grit
        gritGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, t);
        filter.frequency.linearRampToValueAtTime(50, t + 0.5);

        osc.connect(gain);
        osc2.connect(filter).connect(gritGain);
        
        gain.connect(this.bgmBus!);
        gritGain.connect(this.bgmBus!);
        
        osc.start(t); osc.stop(t + 0.8);
        osc2.start(t); osc2.stop(t + 0.8);
    }

    private playPadChord(t: number, freqs: number[]) {
        // Orchestral/Synth Pad Swell
        const attack = 0.5;
        const release = 2.0;
        
        freqs.forEach((f, i) => {
            const osc = this.ctx!.createOscillator();
            osc.type = i % 2 === 0 ? 'triangle' : 'sawtooth';
            osc.frequency.setValueAtTime(f, t);
            
            // Detune slightly for thickness
            osc.detune.value = Math.random() * 10 - 5;

            const filter = this.ctx!.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, t);
            filter.frequency.linearRampToValueAtTime(1200, t + attack + 0.5); // Open up
            filter.frequency.linearRampToValueAtTime(200, t + attack + release);

            const gain = this.ctx!.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.08, t + attack);
            gain.gain.linearRampToValueAtTime(0, t + attack + release);

            osc.connect(filter).connect(gain).connect(this.bgmBus!);
            osc.start(t);
            osc.stop(t + attack + release);
        });
    }

    private playKick(t: number) {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.4);
        g.gain.setValueAtTime(0.9, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        
        // Click transient
        const osc2 = this.ctx!.createOscillator();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, t);
        const g2 = this.ctx!.createGain();
        g2.gain.setValueAtTime(0.1, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(g).connect(this.bgmBus!);
        osc2.connect(g2).connect(this.bgmBus!);
        
        osc.start(t); osc.stop(t + 0.4);
        osc2.start(t); osc2.stop(t + 0.05);
    }

    private playHat(t: number, open: boolean) {
        const osc = this.ctx!.createOscillator();
        osc.type = 'square';
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        const g = this.ctx!.createGain();
        g.gain.setValueAtTime(0.05, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.3 : 0.05));
        osc.connect(filter).connect(g).connect(this.bgmBus!);
        osc.start(t); osc.stop(t + 0.3);
    }

    // --- SCHEDULER ---

    scheduleNote(step: number, t: number) {
        if (!this.ctx) return;

        // Change Chord every 4 bars (64 steps)
        if (step === 0 && this.barCount % 4 === 0) {
            this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
            // Play Pad Swell on chord change
            this.playPadChord(t, this.chords[this.currentChordIndex]);
        }

        const currentFreqs = this.chords[this.currentChordIndex];
        // SAFETY CHECK: Ensure we have frequencies to play
        if (!currentFreqs) return;
        
        const root = currentFreqs[0];

        // --- RHYTHM SECTION ---
        
        // ETHOS: Sparse, cinematic
        if (this.theme === 'ETHOS') {
             if (step === 0 && this.barCount % 2 === 0) this.playSubBass(t, root / 2);
             // Gentle texture, no drums
             return;
        }

        // MAP: IDM / Glitchy
        if (this.theme === 'MAP') {
            if (step === 0) this.playKick(t);
            if (step === 10 && Math.random() > 0.3) this.playKick(t);
            if (step === 4 && Math.random() > 0.8) this.playHat(t, true);
            if (step % 2 === 0) this.playHat(t, false);
            
            if (step === 0) this.playSubBass(t, root / 2);
        }

        // SECTOR: Driving, Aggressive
        if (this.theme === 'SECTOR') {
            // Four on the floor kick
            if (step % 4 === 0) this.playKick(t);
            
            // Off-beat hats
            if (step % 4 === 2) this.playHat(t, true);
            
            // Running Bassline (16th notes)
            if (step % 2 === 0) {
                // Sidechain ducking simulation via velocity
                const isKick = step % 4 === 0;
                this.playSubBass(t, isKick ? root / 2 : root);
            }
        }
    }

    scheduler() {
        if (!this.ctx) return;
        const lookahead = 25.0;
        const scheduleAheadTime = 0.1;
        
        while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
            this.scheduleNote(this.current16thNote, this.nextNoteTime);
            
            const secondsPerBeat = 60.0 / this.tempo;
            this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
            
            this.current16thNote++;
            if (this.current16thNote === 16) {
                this.current16thNote = 0;
                this.barCount++;
            }
        }
        this.timerID = window.setTimeout(this.scheduler.bind(this), lookahead);
    }

    startBGM() {
        if (!this.ctx || this.isPlaying) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.isPlaying = true;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.scheduler();
    }

    playSFX(type: 'hover' | 'click' | 'boot' | 'success' | 'scan' | 'hack_tick' | 'hack_win' | 'hack_fail' | 'level_up' | 'credit') {
        if (!this.ctx || !this.sfxBus) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g).connect(this.sfxBus);

        if (type === 'hover') {
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.linearRampToValueAtTime(1200, t+0.05);
            g.gain.setValueAtTime(0.05, t);
            g.gain.linearRampToValueAtTime(0, t+0.05);
        } else if (type === 'click') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, t);
            g.gain.setValueAtTime(0.05, t);
            g.gain.exponentialRampToValueAtTime(0.001, t+0.05);
        } else if (type === 'hack_tick') {
             osc.type = 'square';
             osc.frequency.setValueAtTime(1200, t);
             g.gain.setValueAtTime(0.05, t);
             g.gain.exponentialRampToValueAtTime(0.001, t+0.02);
        } else if (type === 'hack_win') {
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(440, t);
             osc.frequency.linearRampToValueAtTime(880, t+0.1);
             g.gain.setValueAtTime(0.2, t);
             g.gain.linearRampToValueAtTime(0, t+0.3);
        } else if (type === 'hack_fail') {
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(100, t);
             osc.frequency.linearRampToValueAtTime(50, t+0.2);
             g.gain.setValueAtTime(0.3, t);
             g.gain.linearRampToValueAtTime(0, t+0.3);
        } else if (type === 'level_up') {
             // Arpeggio
             const freqs = [440, 554, 659, 880];
             freqs.forEach((f, i) => {
                 const o = this.ctx!.createOscillator();
                 const gain = this.ctx!.createGain();
                 o.frequency.setValueAtTime(f, t + i*0.1);
                 gain.gain.setValueAtTime(0.1, t + i*0.1);
                 gain.gain.linearRampToValueAtTime(0, t + i*0.1 + 0.3);
                 o.connect(gain).connect(this.sfxBus!);
                 o.start(t + i*0.1);
                 o.stop(t + i*0.1 + 0.3);
             });
             return; // Custom handled
        } else if (type === 'credit') {
             osc.type = 'sine';
             osc.frequency.setValueAtTime(2000, t);
             osc.frequency.linearRampToValueAtTime(3000, t+0.1);
             g.gain.setValueAtTime(0.1, t);
             g.gain.linearRampToValueAtTime(0, t+0.1);
        } else if (type === 'boot') {
            const noise = this.ctx.createBufferSource();
            const b = this.ctx.createBuffer(1, 44100, 44100);
            const d = b.getChannelData(0);
            for(let i=0; i<d.length; i++) d[i] = Math.random()*2-1;
            noise.buffer = b;
            
            const f = this.ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.setValueAtTime(1000, t);
            f.frequency.exponentialRampToValueAtTime(50, t+1);
            
            g.gain.setValueAtTime(0.8, t);
            g.gain.exponentialRampToValueAtTime(0.001, t+1.5);
            
            noise.connect(f).connect(g).connect(this.sfxBus);
            noise.start(t);
        } else if (type === 'scan') {
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(400, t);
             osc.frequency.linearRampToValueAtTime(1800, t+0.1);
             g.gain.setValueAtTime(0.05, t);
             g.gain.linearRampToValueAtTime(0, t+0.1);
        } else if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(660, t);
            osc.frequency.setValueAtTime(880, t+0.1);
            g.gain.setValueAtTime(0.1, t);
            g.gain.linearRampToValueAtTime(0, t+0.4);
        }

        osc.start(t); osc.stop(t+0.4);
    }
}

export const audio = new AudioCore();
