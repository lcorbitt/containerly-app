"use client";

import {
  SHIPMENT_INSIGHT_CARD_BASE_CLASS,
  SHIPMENT_INSIGHT_CARD_DETAIL_CLASS,
  SHIPMENT_INSIGHT_CARD_HEADLINE_CLASS,
  SHIPMENT_INSIGHT_CARD_TONE_CLASS,
  SHIPMENT_INSIGHT_CARDS_CLASS,
} from "./constants";
import type { ShipmentInsightCardsProps } from "./types";

export function ShipmentInsightCards({ cards }: ShipmentInsightCardsProps) {
  if (cards.length === 0) return null;

  return (
    <div className={SHIPMENT_INSIGHT_CARDS_CLASS} aria-label="Shipment insights">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`${SHIPMENT_INSIGHT_CARD_BASE_CLASS} ${SHIPMENT_INSIGHT_CARD_TONE_CLASS[card.tone]}`}
        >
          <p className={SHIPMENT_INSIGHT_CARD_HEADLINE_CLASS}>{card.headline}</p>
          {card.detail ? <p className={SHIPMENT_INSIGHT_CARD_DETAIL_CLASS}>{card.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}
