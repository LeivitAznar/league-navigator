export type Team = "home" | "away";
export type Role = "GK" | "DEF" | "MID" | "FWD";

export interface PlayerSpawn {
  team: Team;
  role: Role;
  /** Normalized formation position, -1..1 on both axes (home side); mirrored for away. */
  nx: number;
  ny: number;
  number: number;
  isHuman: boolean;
  color: number;
}
