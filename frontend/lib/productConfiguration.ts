export type AnchoringType =
  | "interior_holes"
  | "frontal_holes"
  | "plates"
  | "side_claws"
  | "front_claws";

export type ProductColor = "white" | "black" | "anthracite" | "green";

export const anchoringOptions: Array<{
  value: AnchoringType;
  label: string;
}> = [
  { value: "interior_holes", label: "Sin obra con agujeros interiores (sin coste)" },
  { value: "frontal_holes", label: "Sin obra con agujeros frontales (sin coste)" },
  { value: "plates", label: "Sin obra con pletinas (+14,99€)" },
  { value: "side_claws", label: "Con obra con garras metalicas laterales (+39€)" },
  { value: "front_claws", label: "Con obra con garras frontales (+39€)" },
];

export const colorOptions: Array<{
  value: ProductColor;
  label: string;
}> = [
  { value: "white", label: "Blanco" },
  { value: "black", label: "Negro" },
  { value: "anthracite", label: "Antracita" },
  { value: "green", label: "Verde" },
];

const anchoringLabels = Object.fromEntries(
  anchoringOptions.map((option) => [option.value, option.label]),
) as Record<AnchoringType, string>;

const colorLabels = Object.fromEntries(
  colorOptions.map((option) => [option.value, option.label]),
) as Record<ProductColor, string>;

export function getAnchoringLabel(anchoringType: string) {
  return anchoringLabels[anchoringType as AnchoringType] ?? anchoringType;
}

export function getColorLabel(color: string) {
  return colorLabels[color as ProductColor] ?? color;
}
