import { z } from "zod"

// Matches emoji characters (Unicode Extended_Pictographic)
const EMOJI_RE = /\p{Extended_Pictographic}/u

// Matches WhatsApp formatting characters (* _ ~) used for bold/italic/strikethrough
const FORMAT_CHARS_RE = /[*_~]/

// Matches template variables like {{1}}, {{2}}, etc.
const VARIABLE_RE = /\{\{(\d+)\}\}/g

// Matches leading variable (variable at start of text)
const LEADING_VARIABLE_RE = /^\s*\{\{\d+\}\}/

// Matches trailing variable (variable at end of text)
const TRAILING_VARIABLE_RE = /\{\{\d+\}\}\s*$/

// Matches any variable pattern in text
const HAS_VARIABLE_RE = /\{\{/

/**
 * Header text must be single-line, no emoji, no formatting chars (* _ ~),
 * max one {{1}} variable, ≤60 chars.
 * Meta subcode 2388072.
 */
export function refineHeaderText(
	text: string | null | undefined,
	ctx: z.RefinementCtx,
	path: string[] = ["header", "text"],
) {
	if (!text || text.trim().length === 0) return

	if (text.includes("\n") || text.includes("\r")) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message:
				"العنوان يجب أن يكون سطراً واحداً بدون رموز تعبيرية أو تنسيق.",
			path,
		})
	}

	if (EMOJI_RE.test(text)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message:
				"العنوان يجب أن يكون سطراً واحداً بدون رموز تعبيرية أو تنسيق.",
			path,
		})
	}

	if (FORMAT_CHARS_RE.test(text)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message:
				"العنوان يجب أن يكون سطراً واحداً بدون رموز تعبيرية أو تنسيق.",
			path,
		})
	}

	// Max one {{1}} variable in header
	const matches = text.match(VARIABLE_RE)
	if (matches && matches.length > 1) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "العنوان يقبل متغيراً واحداً فقط {{1}}.",
			path,
		})
	}

	// If header has a variable, it must not be leading or trailing
	if (matches && matches.length > 0) {
		if (LEADING_VARIABLE_RE.test(text) || TRAILING_VARIABLE_RE.test(text)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					"لا يمكن أن يبدأ النص أو ينتهي بمتغير — أضف كلمة قبله أو بعده.",
				path,
			})
		}
	}
}

/**
 * Body text must not start or end with a variable.
 * Variables must be sequential {{1}}, {{2}}, ... with no gaps or duplicates.
 * Meta subcodes 2388299, 2388042.
 */
export function refineBodyText(
	text: string,
	ctx: z.RefinementCtx,
	path: string[] = ["body", "text"],
) {
	if (!text || text.trim().length === 0) return

	if (LEADING_VARIABLE_RE.test(text)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message:
				"لا يمكن أن يبدأ النص أو ينتهي بمتغير — أضف كلمة قبله أو بعده.",
			path,
		})
	}

	if (TRAILING_VARIABLE_RE.test(text)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message:
				"لا يمكن أن يبدأ النص أو ينتهي بمتغير — أضف كلمة قبله أو بعده.",
			path,
		})
	}

	// Check sequential variables
	const matches = [...text.matchAll(VARIABLE_RE)]
	if (matches.length > 0) {
		const numbers = matches.map((m) => Number.parseInt(m[1], 10))
		const seen = new Set<number>()
		for (let i = 0; i < numbers.length; i++) {
			const num = numbers[i]
			if (seen.has(num)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						"يجب ترقيم المتغيرات بالتسلسل {{1}} ثم {{2}} بدون فجوات أو تكرار.",
					path,
				})
				return
			}
			seen.add(num)
		}
		// Check for sequential ordering (1, 2, 3...)
		const sorted = [...seen].sort((a, b) => a - b)
		for (let i = 0; i < sorted.length; i++) {
			if (sorted[i] !== i + 1) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message:
						"يجب ترقيم المتغيرات بالتسلسل {{1}} ثم {{2}} بدون فجوات أو تكرار.",
					path,
				})
				return
			}
		}
	}
}

/**
 * Footer must not contain any template variables.
 */
export function refineFooterText(
	footer: string | null | undefined,
	ctx: z.RefinementCtx,
	path: string[] = ["footer"],
) {
	if (!footer) return

	if (HAS_VARIABLE_RE.test(footer)) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "التذييل لا يقبل متغيرات.",
			path,
		})
	}
}

/**
 * Validate that every variable has a non-empty sample value.
 * Meta subcode 2388043.
 */
export function refineSampleValues(
	variables: string[],
	text: string,
	ctx: z.RefinementCtx,
	path: string[] = ["body", "variables"],
) {
	const matches = [...text.matchAll(VARIABLE_RE)]
	if (matches.length === 0) return

	for (let i = 0; i < matches.length; i++) {
		if (!variables[i] || variables[i].trim().length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "أدخل قيمة مثال لكل متغير — مطلوبة لمراجعة Meta.",
				path: [...path, i],
			})
		}
	}
}
