export interface Flags {
  [flagName:string]: Flag
}

export interface Flag {
  flagName: string,
  description: string,
  type: string,
  default?: string | number | boolean
}