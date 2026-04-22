export interface FusePanelSummary {
  key: string;
  title: string;
  description: string;
}

export interface FuseItem {
  color: string;
  value: string;
  description: string;
  empty?: boolean;
}

export interface FuseGrid {
  columns: number;
  rows?: number;
  items: string[];
}

export interface FuseSection {
  key: string;
  title: string;
  itemLabel: string;
  valueLabel: string;
  note?: string;
  grids: FuseGrid[];
  items: Record<string, FuseItem>;
}

export interface FuseLink {
  label: string;
  url: string;
}

export interface FusePanel {
  key: string;
  title: string;
  description: string;
  sections: FuseSection[];
  links?: FuseLink[];
}
