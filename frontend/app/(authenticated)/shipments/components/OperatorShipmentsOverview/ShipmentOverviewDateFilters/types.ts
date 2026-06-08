export interface ShipmentOverviewDateFiltersProps {
  etdFrom: string;
  etdTo: string;
  etaFrom: string;
  etaTo: string;
  disabled?: boolean;
  idPrefix?: string;
  onEtdFromChange: (value: string) => void;
  onEtdToChange: (value: string) => void;
  onEtaFromChange: (value: string) => void;
  onEtaToChange: (value: string) => void;
  onClear: () => void;
}
