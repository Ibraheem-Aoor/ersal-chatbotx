import {
  appendCodeToMagicLink,
  type ButtonStepProps,
  buttonTypes,
  encodeButtonPayload,
  extractMetadata,
  type MetadataPayload,
} from "@chatbotx.io/flow-config"
import {
  getCanonicalReplyPayload,
  type MessageButtonTemplate,
} from "@chatbotx.io/sdk"
import {
  ActionButtons,
  ActionCTA,
  ActionList,
  Body,
  Button,
  type Header,
  Interactive,
  ListSection,
  Row,
} from "whatsapp-api-js/messages"
import type { ClientMessage } from "whatsapp-api-js/types"
import { logger } from "../../../lib/logger"

export const MAX_BUTTONS = 3
export const MAX_LIST_ROWS = 10
export const DEFAULT_LIST_BUTTON_LABEL = "Options"

const ROW_ID_MAX_LENGTH = 200

type WhatsappReplyButton = {
  id: string
  label: string
}

function normalizeRawButton(props: {
  flowId: string
  flowVersionId?: string
  button: ButtonStepProps
  metadata?: MetadataPayload
}): WhatsappReplyButton {
  const { flowId, flowVersionId, button, metadata } = props

  return {
    id: encodeButtonPayload({
      flowId,
      flowVersionId,
      buttonId: button.id,
      broadcastId: extractMetadata("broadcastId", metadata),
      sequenceStepId: extractMetadata("sequenceStepId", metadata),
    }),
    label: button.label,
  }
}

function normalizeCanonicalQuickReply(
  button: MessageButtonTemplate,
): WhatsappReplyButton {
  return {
    id: getCanonicalReplyPayload(button),
    label: button.label,
  }
}

export function buildWhatsappButtonMessages(props: {
  flowId: string
  flowVersionId?: string
  buttons: ButtonStepProps[]
  quickReplies?: MessageButtonTemplate[]
  metadata?: MetadataPayload
  bodyText: string
  header?: Header
}): ClientMessage[] {
  const quickReplies = props.quickReplies ?? []
  const totalButtons = props.buttons.length + quickReplies.length

  if (totalButtons === 0) {
    return []
  }

  const hasUrlButtons = props.buttons.some(
    (b) => b.buttonType === buttonTypes.enum.openWebsite && b.beforeStep.url,
  )

  if (!hasUrlButtons) {
    return buildReplyOnlyMessages(props, quickReplies)
  }

  const soleButton = totalButtons === 1 ? props.buttons[0] : undefined
  if (
    soleButton &&
    soleButton.buttonType === buttonTypes.enum.openWebsite &&
    soleButton.beforeStep.url
  ) {
    const payload = encodeButtonPayload({
      flowId: props.flowId,
      flowVersionId: props.flowVersionId,
      buttonId: soleButton.id,
      broadcastId: extractMetadata("broadcastId", props.metadata),
      sequenceStepId: extractMetadata("sequenceStepId", props.metadata),
    })
    const url = appendCodeToMagicLink(soleButton.beforeStep.url, payload)
    return [
      new Interactive(
        new ActionCTA(soleButton.label, url),
        new Body(props.bodyText || soleButton.label),
      ),
    ]
  }

  let enrichedBody = props.bodyText
  for (const button of props.buttons) {
    if (
      button.buttonType === buttonTypes.enum.openWebsite &&
      button.beforeStep.url
    ) {
      const payload = encodeButtonPayload({
        flowId: props.flowId,
        flowVersionId: props.flowVersionId,
        buttonId: button.id,
        broadcastId: extractMetadata("broadcastId", props.metadata),
        sequenceStepId: extractMetadata("sequenceStepId", props.metadata),
      })
      enrichedBody += `\n\n${button.label}: ${appendCodeToMagicLink(button.beforeStep.url, payload)}`
    }
  }

  return buildReplyOnlyMessages(
    { ...props, bodyText: enrichedBody },
    quickReplies,
  )
}

function buildReplyOnlyMessages(
  props: {
    flowId: string
    flowVersionId?: string
    buttons: ButtonStepProps[]
    metadata?: MetadataPayload
    bodyText: string
    header?: Header
  },
  quickReplies: MessageButtonTemplate[],
): ClientMessage[] {
  const buttons: WhatsappReplyButton[] = [
    ...props.buttons.map((button) =>
      normalizeRawButton({
        flowId: props.flowId,
        flowVersionId: props.flowVersionId,
        button,
        metadata: props.metadata,
      }),
    ),
    ...quickReplies.map(normalizeCanonicalQuickReply),
  ]

  if (buttons.length <= MAX_BUTTONS) {
    const actionButtons = buttons.map(
      (button) => new Button(button.id, button.label),
    )

    return [
      new Interactive(
        new ActionButtons(...(actionButtons as [Button, ...Button[]])),
        new Body(props.bodyText),
        props.header,
      ),
    ]
  }

  const listButtons = buttons.slice(0, MAX_LIST_ROWS)
  if (listButtons.length < buttons.length) {
    logger.warn(
      { total: buttons.length, kept: MAX_LIST_ROWS },
      `WhatsApp interactive lists support at most ${MAX_LIST_ROWS} quick reply rows; truncating extra buttons`,
    )
  }

  const rows = listButtons.map(
    (button) =>
      new Row(button.id.slice(0, ROW_ID_MAX_LENGTH), button.label.slice(0, 24)),
  )
  const [firstRow, ...restRows] = rows

  return [
    new Interactive(
      new ActionList(
        DEFAULT_LIST_BUTTON_LABEL,
        new ListSection(undefined, firstRow, ...restRows),
      ),
      new Body(props.bodyText),
    ),
  ]
}
