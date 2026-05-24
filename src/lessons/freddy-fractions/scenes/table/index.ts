export { Pizza } from "./Pizza";
export type { PizzaProps, PizzaFraction } from "./Pizza";

export { PizzaPiece } from "./PizzaPiece";
export type { PizzaPieceProps } from "./PizzaPiece";

export {
  assetSrcFor,
  canSlice,
  childOffsetsFor,
  childSlotsFor,
  dimsForSlot,
  fractionForSlot,
} from "./sliceLogic";
export type { PieceSlot, PizzaVariant } from "./sliceLogic";

export { buildWholePiece, useSandboxPieces } from "./useSandboxPieces";
export type {
  SandboxPiece,
  SliceResult,
  UseSandboxPiecesOptions,
} from "./useSandboxPieces";

export {
  PROXIMITY_THRESHOLD_PX,
  admitsEqualPartition,
  findProximityGroups,
  fractionToNumber,
  pieceGap,
  piecesAreClose,
} from "./proximity";
export type { ProximityGroup, ProximityPiece } from "./proximity";

export { Table } from "./Table";
