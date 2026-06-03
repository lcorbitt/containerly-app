"use client";

import { Import, PackagePlus } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavBrand } from "../NavBrand";
import { TopNavBreadcrumb } from "../TopNavBreadcrumb";
import { TopNavShell } from "../TopNavShell";
import { NotificationsMenu } from "./NotificationsMenu";
import {
  AUTHENTICATED_TOP_NAV_ACTION_CLASS,
  AUTHENTICATED_TOP_NAV_ACTION_LABEL_CLASS,
  AUTHENTICATED_TOP_NAV_ACTIONS_PRIMARY_GROUP_CLASS,
  AUTHENTICATED_TOP_NAV_ACTIONS_ROW_CLASS,
  AUTHENTICATED_TOP_NAV_ACTIONS_UTILITY_GROUP_CLASS,
  AUTHENTICATED_TOP_NAV_UTILITY_ICON_BUTTON_CLASS,
  AUTHENTICATED_TOP_NAV_BULK_IMPORT_ACTION_CLASS,
  AUTHENTICATED_TOP_NAV_BULK_IMPORT_ICON_CLASS,
  AUTHENTICATED_TOP_NAV_BULK_IMPORT_INNER_CLASS,
  AUTHENTICATED_TOP_NAV_BRAND_ROW_CLASS,
} from "./constants";
import { useAuthenticatedTopNav } from "./useAuthenticatedTopNav";

export function AuthenticatedTopNav() {
  const {
    notificationsMenuOpen,
    notificationsMenuRef,
    selectedOrgId,
    alerts,
    unackedCount,
    orgSegment,
    tabSegment,
    activeSubTabName,
    hubSubTabLabel,
    hubSubTabHref,
    hubLeafLabel,
    isFreight,
    openNewShipmentModal,
    openBulkImportModal,
    toggleNotificationsMenu,
    closeNotificationsMenu,
  } = useAuthenticatedTopNav();

  return (
    <TopNavShell variant="app">
      <div className={AUTHENTICATED_TOP_NAV_BRAND_ROW_CLASS}>
        <NavBrand href="/dashboard" variant="app" />
        <TopNavBreadcrumb
          org={orgSegment}
          tab={tabSegment}
          subTabLabel={hubSubTabLabel ?? activeSubTabName}
          subTabHref={hubSubTabHref}
          leafLabel={hubLeafLabel}
        />
      </div>

      <div className={AUTHENTICATED_TOP_NAV_ACTIONS_ROW_CLASS}>
        {isFreight ? (
          <div className={AUTHENTICATED_TOP_NAV_ACTIONS_PRIMARY_GROUP_CLASS}>
            <button
              type="button"
              onClick={() => openNewShipmentModal()}
              className={AUTHENTICATED_TOP_NAV_ACTION_CLASS}
              title="Create a new shipment"
              aria-label="New shipment"
              aria-haspopup="dialog"
            >
              <PackagePlus className="h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-300" strokeWidth={2} aria-hidden />
              <span className={AUTHENTICATED_TOP_NAV_ACTION_LABEL_CLASS}>New Shipment</span>
            </button>
            <button
              type="button"
              onClick={() => openBulkImportModal()}
              className={AUTHENTICATED_TOP_NAV_BULK_IMPORT_ACTION_CLASS}
              title="Bulk import shipments from Excel or CSV"
              aria-label="Bulk import"
              aria-haspopup="dialog"
            >
              <span className={AUTHENTICATED_TOP_NAV_BULK_IMPORT_INNER_CLASS}>
                <Import
                  className={`h-4 w-4 shrink-0 ${AUTHENTICATED_TOP_NAV_BULK_IMPORT_ICON_CLASS}`}
                  strokeWidth={2}
                  aria-hidden
                />
                <span className={AUTHENTICATED_TOP_NAV_ACTION_LABEL_CLASS}>Bulk Import</span>
              </span>
            </button>
          </div>
        ) : null}

        <div className={AUTHENTICATED_TOP_NAV_ACTIONS_UTILITY_GROUP_CLASS}>
          <ThemeToggle className={AUTHENTICATED_TOP_NAV_UTILITY_ICON_BUTTON_CLASS} />

          {selectedOrgId ? (
            <NotificationsMenu
              open={notificationsMenuOpen}
              alerts={alerts}
              unackedCount={unackedCount}
              menuRef={notificationsMenuRef}
              onToggle={toggleNotificationsMenu}
              onClose={closeNotificationsMenu}
            />
          ) : null}
        </div>
      </div>
    </TopNavShell>
  );
}
