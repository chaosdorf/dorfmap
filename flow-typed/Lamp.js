// @flow
export type Lamp = {
  status_text: ?string,
  rate_delay: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  name: string,
  type: string,
  status: 0 | 1,
  duplicates?: Lamp[],
  layer: string,
  image: string,
  is_writable: number,
};
