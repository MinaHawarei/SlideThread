export interface SpikeFormat {
  id: string;
  name: string;
  width: number;
  height: number;
}

export const SPIKE_FORMATS: SpikeFormat[] = [
  { id: 'portrait_4_5', name: 'Portrait (4:5)', width: 1080, height: 1350 },
  { id: 'square_1_1', name: 'Square (1:1)', width: 1080, height: 1080 },
  { id: 'story_9_16', name: 'Story (9:16)', width: 1080, height: 1920 },
  { id: 'landscape_16_9', name: 'Landscape (16:9)', width: 1920, height: 1080 },
];
