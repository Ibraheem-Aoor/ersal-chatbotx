import {
  PURGE_WORKSPACES_INTERVAL_MINUTES,
  ScheduleJobData,
  scheduleQueue,
} from "@chatbotx.io/worker-config"
import { Queue } from "bullmq"
import { env } from "../../env"

/**
 * Trial teardown disconnects every channel of an expired trial owner, and
 * off-cloud there is no billing path to recover from that. These schedulers
 * must remain cloud-only.
 */
const CLOUD_ONLY_SCHEDULERS = [
  ScheduleJobData.reconcileTenants,
  ScheduleJobData.unsubscribeExpiredTrials,
] as const

/**
 * Quota reconciliation runs on both cloud and enterprise editions. The
 * syncUserQuota job recounts workspaces/channels/contacts/teamMembers from
 * the source DB tables, healing any counter drift — no private portal
 * dependency. FORK PATCH: upstream gates this to cloud-only; we enable it
 * for enterprise so self-hosted quota enforcement stays accurate.
 */
const CLOUD_OR_ENTERPRISE_SCHEDULERS = [
  ScheduleJobData.syncUserQuota,
] as const

export const registerSchedules = async () => {
  if (!(scheduleQueue instanceof Queue)) {
    return
  }

  const isCloud = env.NEXT_PUBLIC_EDITION === "cloud"
  const isEnterprise = env.NEXT_PUBLIC_EDITION === "enterprise"
  if (!isCloud) {
    // upsertJobScheduler persists in Redis: a scheduler registered by an
    // earlier cloud boot (or a shared Redis) keeps firing until removed.
    for (const name of CLOUD_ONLY_SCHEDULERS) {
      await scheduleQueue.removeJobScheduler(name)
    }
  }
  if (!isCloud && !isEnterprise) {
    for (const name of CLOUD_OR_ENTERPRISE_SCHEDULERS) {
      await scheduleQueue.removeJobScheduler(name)
    }
  }

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.enqueueBroadcast,
    {
      pattern: "* * * * *",
    },
    {
      name: ScheduleJobData.enqueueBroadcast,
      data: {
        type: ScheduleJobData.enqueueBroadcast,
        data: {
          schedulesAt: new Date(),
        },
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.finalizeBroadcasts,
    {
      pattern: "* * * * *",
    },
    {
      name: ScheduleJobData.finalizeBroadcasts,
      data: {
        type: ScheduleJobData.finalizeBroadcasts,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.reconcileBroadcasts,
    {
      pattern: "* * * * *",
    },
    {
      name: ScheduleJobData.reconcileBroadcasts,
      data: {
        type: ScheduleJobData.reconcileBroadcasts,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.evaluateTriggers,
    {
      pattern: "* * * * *",
      // every: 5000,
    },
    {
      name: ScheduleJobData.evaluateTriggers,
      data: {
        type: ScheduleJobData.evaluateTriggers,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.cleanupTriggers,
    {
      pattern: "0 3 * * *",
    },
    {
      name: ScheduleJobData.cleanupTriggers,
      data: {
        type: ScheduleJobData.cleanupTriggers,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.evaluateDateTimeWebhooks,
    {
      pattern: "* * * * *",
    },
    {
      name: ScheduleJobData.evaluateDateTimeWebhooks,
      data: {
        type: ScheduleJobData.evaluateDateTimeWebhooks,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.cleanupWebhookExecutions,
    {
      pattern: "0 4 * * *",
    },
    {
      name: ScheduleJobData.cleanupWebhookExecutions,
      data: {
        type: ScheduleJobData.cleanupWebhookExecutions,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.scanSmartDelay,
    {
      pattern: "*/5 * * * *",
    },
    {
      name: ScheduleJobData.scanSmartDelay,
      data: {
        type: ScheduleJobData.scanSmartDelay,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.scanAppointmentReminders,
    {
      pattern: "*/5 * * * *",
    },
    {
      name: ScheduleJobData.scanAppointmentReminders,
      data: {
        type: ScheduleJobData.scanAppointmentReminders,
        data: {
          triggeredAt: new Date().toISOString(),
        },
      },
    },
  )

  // FORK PATCH: syncUserQuota runs on cloud AND enterprise editions.
  // It only reads our own DB tables — no private portal dependency.
  if (isCloud || isEnterprise) {
    await scheduleQueue.upsertJobScheduler(
      ScheduleJobData.syncUserQuota,
      { every: env.QUOTA_SYNC_INTERVAL_SECONDS * 1000 },
      {
        name: ScheduleJobData.syncUserQuota,
        data: { type: ScheduleJobData.syncUserQuota, data: {} },
      },
    )
  }

  if (isCloud) {
    await scheduleQueue.upsertJobScheduler(
      ScheduleJobData.reconcileTenants,
      { every: env.QUOTA_SYNC_INTERVAL_SECONDS * 1000 },
      {
        name: ScheduleJobData.reconcileTenants,
        data: { type: ScheduleJobData.reconcileTenants, data: {} },
      },
    )
  }

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.maintainMacPartitions,
    {
      pattern: "0 1 * * *",
    },
    {
      name: ScheduleJobData.maintainMacPartitions,
      data: {
        type: ScheduleJobData.maintainMacPartitions,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.scanCoexistRuns,
    {
      pattern: "* * * * *",
    },
    {
      name: ScheduleJobData.scanCoexistRuns,
      data: {
        type: ScheduleJobData.scanCoexistRuns,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.reconcileMetaCatalogSyncs,
    {
      pattern: "* * * * *",
    },
    {
      name: ScheduleJobData.reconcileMetaCatalogSyncs,
      data: {
        type: ScheduleJobData.reconcileMetaCatalogSyncs,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.purgeCoexistStaging,
    {
      pattern: "0 * * * *",
    },
    {
      name: ScheduleJobData.purgeCoexistStaging,
      data: {
        type: ScheduleJobData.purgeCoexistStaging,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.purgeWhatsappSignupSessions,
    {
      pattern: "0 * * * *",
    },
    {
      name: ScheduleJobData.purgeWhatsappSignupSessions,
      data: {
        type: ScheduleJobData.purgeWhatsappSignupSessions,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.purgeWorkspaces,
    {
      pattern: `*/${PURGE_WORKSPACES_INTERVAL_MINUTES} * * * *`,
    },
    {
      name: ScheduleJobData.purgeWorkspaces,
      data: {
        type: ScheduleJobData.purgeWorkspaces,
        data: {},
      },
    },
  )

  await scheduleQueue.upsertJobScheduler(
    ScheduleJobData.refreshChannelTokens,
    {
      pattern: "0 2 * * *",
    },
    {
      name: ScheduleJobData.refreshChannelTokens,
      data: {
        type: ScheduleJobData.refreshChannelTokens,
        data: {},
      },
    },
  )

  if (isCloud) {
    await scheduleQueue.upsertJobScheduler(
      ScheduleJobData.unsubscribeExpiredTrials,
      {
        pattern: "0 * * * *",
      },
      {
        name: ScheduleJobData.unsubscribeExpiredTrials,
        data: {
          type: ScheduleJobData.unsubscribeExpiredTrials,
          data: {},
        },
      },
    )
  }
}
