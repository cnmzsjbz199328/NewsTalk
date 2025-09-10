// FIX: Create the SettingsPanel component.
import React from 'react';
import { Settings } from '../types';
import { Slider } from './Slider';
import { SunIcon, MoonIcon } from './icons';
import { KOKORO_TTS_VOICES } from '../constants';

interface SettingsPanelProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  theme: 'light' | 'dark';
  onThemeChange: () => void;
}

const VoiceSelector: React.FC<{id: keyof Settings, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void}> = ({ id, label, value, onChange }) => (
    <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-bunker-600 dark:text-bunker-300 whitespace-nowrap">{label}</label>
        <select
            id={id}
            value={value}
            onChange={onChange}
            className="w-full p-2 bg-white dark:bg-bunker-700 border border-bunker-300 dark:border-bunker-600 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
        >
            {KOKORO_TTS_VOICES.map(voice => (
                <option key={voice.id} value={voice.id}>{voice.name}</option>
            ))}
        </select>
    </div>
);


export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange, theme, onThemeChange }) => {
  return (
    <div className="w-full max-w-sm h-full bg-bunker-50 dark:bg-bunker-900 border-r border-bunker-200 dark:border-bunker-800 flex flex-col">
      <h3 className="text-xl font-bold p-4 border-b border-bunker-200 dark:border-bunker-800 flex justify-between items-center">
        Settings
        <button onClick={onThemeChange} className="p-2 rounded-full hover:bg-bunker-200 dark:hover:bg-bunker-700 transition">
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
        </button>
      </h3>
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        <div>
          <h4 className="font-bold mb-2 text-bunker-800 dark:text-bunker-200">Debate Parameters</h4>
          <div className="space-y-4">
            <Slider
              id="debateRounds"
              label="Debate Rounds"
              min={1}
              max={10}
              value={settings.debateRounds}
              onChange={(e) => onSettingsChange({ debateRounds: parseInt(e.target.value, 10) })}
              unit=" rounds"
            />
            <Slider
              id="charLimit"
              label="Character Limit"
              min={50}
              max={500}
              value={settings.charLimit}
              onChange={(e) => onSettingsChange({ charLimit: parseInt(e.target.value, 10) })}
              unit=" chars"
            />
            <Slider
              id="contextTurns"
              label="Context Turns"
              min={1}
              max={10}
              value={settings.contextTurns}
              onChange={(e) => onSettingsChange({ contextTurns: parseInt(e.target.value, 10) })}
              unit=" turns"
            />
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-2 text-bunker-800 dark:text-bunker-200">Text-to-Speech</h4>
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="autoPlay" className="text-sm font-medium text-bunker-600 dark:text-bunker-300">Auto-play Speech</label>
                <button
                    id="autoPlay"
                    onClick={() => onSettingsChange({ autoPlay: !settings.autoPlay })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoPlay ? 'bg-sky-600' : 'bg-bunker-300 dark:bg-bunker-700'}`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoPlay ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                </button>
              </div>
               <VoiceSelector id="tomVoice" label="Tom's Voice" value={settings.tomVoice} onChange={e => onSettingsChange({ tomVoice: e.target.value })} />
               <VoiceSelector id="markVoice" label="Mark's Voice" value={settings.markVoice} onChange={e => onSettingsChange({ markVoice: e.target.value })} />
               <VoiceSelector id="samVoice" label="Sam's Voice" value={settings.samVoice} onChange={e => onSettingsChange({ samVoice: e.target.value })} />
              <Slider
                id="speechVolume"
                label="Volume"
                min={0}
                max={100}
                value={settings.speechVolume}
                onChange={(e) => onSettingsChange({ speechVolume: parseInt(e.target.value, 10) })}
                unit="%"
              />
              <Slider
                id="speechRate"
                label="Rate"
                min={50}
                max={200}
                value={settings.speechRate}
                onChange={(e) => onSettingsChange({ speechRate: parseInt(e.target.value, 10) })}
                unit="%"
              />
          </div>
        </div>

      </div>
       <div className="p-2 text-center text-xs text-bunker-400 dark:text-bunker-500 border-t border-bunker-200 dark:border-bunker-800">
        AI Debate Arena v1.0
      </div>
    </div>
  );
};