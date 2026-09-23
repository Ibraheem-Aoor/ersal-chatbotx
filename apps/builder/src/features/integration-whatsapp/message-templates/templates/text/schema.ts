import { z } from "zod"
import { buttonStepSchema, validateButtonLimits } from "../button/schema"
import {
	refineBodyText,
	refineFooterText,
	refineHeaderText,
	refineSampleValues,
} from "../validation"

export const templateTextSchema = z
	.object({
		hideHeader: z.boolean(),
		showFooter: z.boolean(),
		header: z.object({
			text: z.string().trim().max(60).nullable(),
			variables: z.array(z.string().min(1).max(255)).max(1),
		}),
		body: z.object({
			text: z.string().trim().min(1).max(1024),
			variables: z.array(z.string().min(1).max(255)),
		}),
		footer: z.string().trim().max(60).nullable(),
		buttons: z.array(buttonStepSchema).max(10),
	})
	.superRefine((data, ctx) => {
		if (data.hideHeader && data.header.text) {
			refineHeaderText(data.header.text, ctx)
		}
		refineBodyText(data.body.text, ctx)
		refineSampleValues(
			data.body.variables,
			data.body.text,
			ctx,
			["body", "variables"],
		)
		refineFooterText(data.footer, ctx)
		validateButtonLimits(data.buttons, ctx)
	})

export type TemplateTextSchema = z.infer<typeof templateTextSchema>

export const templateTextDefaultValue = (): TemplateTextSchema => ({
	hideHeader: true,
	showFooter: true,
	header: {
		text: "",
		variables: [],
	},
	body: {
		text: "",
		variables: [],
	},
	footer: "",
	buttons: [],
})
