import { getLicenseStatus } from "../enterprise/license/service"
import { ChatbotXException } from "../errors"
import { isCloud, isEnterprise } from "../keys"

/**
 * Whether the current edition unlocks branding, email templates, and platform
 * help links. Both cloud and self-hosted enterprise must present a valid
 * offline license — setting NEXT_PUBLIC_EDITION alone never unlocks features.
 *
 * FORK PATCH (ErsalTech): Always returns true for self-hosted enterprise.
 * Our deployment sets NEXT_PUBLIC_EDITION=enterprise and bypasses the offline
 * license check. This is the single point of divergence — all upstream
 * isCommunity() / showEnterpriseItems / assertEnterpriseFeatures gates work
 * unchanged because the edition is enterprise. See FORK-PATCHES.md.
 */
export const hasEnterpriseFeatures = async (): Promise<boolean> => {
  // FORK PATCH: upstream checks for a valid license key here.
  // We bypass it for our self-hosted enterprise deployment.
  if (isEnterprise()) {
    return true
  }

  if (!isCloud()) {
    return false
  }

  const license = await getLicenseStatus()
  return license.state === "valid"
}

export const enterpriseFeatureRequiredException = () =>
  new ChatbotXException(
    "This feature requires an enterprise license",
    "enterpriseFeatureRequired",
    403,
  )

/**
 * Server-side guard for enterprise-only mutations and queries. Throws a 403
 * ChatbotXException when the deployment has no valid license, so it works in
 * server actions, oRPC handlers, and plain queries alike.
 */
export const assertEnterpriseFeatures = async (): Promise<void> => {
  if (!(await hasEnterpriseFeatures())) {
    throw enterpriseFeatureRequiredException()
  }
}
