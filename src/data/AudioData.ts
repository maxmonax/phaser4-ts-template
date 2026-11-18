export enum AudioAlias {
  Click = 'Click',
  Music = 'Music',
  // Demo round (src/demo)
  Pop = 'Pop',
  Tick = 'Tick',
  RoundEnd = 'RoundEnd',
}

export type AudioLoadData = {
  alias: AudioAlias;
  file: string;
  maxInstances?: number;
};

export const AUDIO_LOAD_DATA: ReadonlyArray<AudioLoadData> = [
  { alias: AudioAlias.Click, file: 'click.mp3', maxInstances: 1 },
  { alias: AudioAlias.Music, file: 'music.mp3' },
  { alias: AudioAlias.Pop, file: 'pop.mp3', maxInstances: 4 },
  { alias: AudioAlias.Tick, file: 'tick.mp3', maxInstances: 1 },
  { alias: AudioAlias.RoundEnd, file: 'round-end.mp3', maxInstances: 1 },
];
