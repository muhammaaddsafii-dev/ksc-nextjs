declare module 'shapefile' {
  interface FeatureCollection {
    type: 'FeatureCollection';
    features: Array<{ type: 'Feature'; geometry: any; properties: any }>;
  }

  function read(
    source: string | ArrayBuffer,
    dbf?: string | ArrayBuffer,
    options?: Record<string, unknown>,
  ): Promise<FeatureCollection>;

  function open(
    source: string | ArrayBuffer,
    dbf?: string | ArrayBuffer,
    options?: Record<string, unknown>,
  ): Promise<any>;
}
