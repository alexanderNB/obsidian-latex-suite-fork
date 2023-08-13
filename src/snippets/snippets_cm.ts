import { ViewUpdate } from "@codemirror/view";
import { StateEffect } from "@codemirror/state";
import { invertedEffects, undo, redo } from "@codemirror/commands";
import { addMark, removeMark } from "./marker_state_field";
import { removeEmptyTabstops } from "./tabstops_state_field";

// Effects that mark the beginning and end of transactions to insert snippets
export const startSnippet = StateEffect.define();
export const endSnippet = StateEffect.define();
export const undidStartSnippet = StateEffect.define();
export const undidEndSnippet = StateEffect.define();


// Enables undoing and redoing snippets, taking care of the tabstops
export const snippetInvertedEffects = invertedEffects.of(tr => {
	const effects = [];

	for (const effect of tr.effects) {
		if (effect.is(addMark)) {
			effects.push(removeMark.of(effect.value));
		}
		else if (effect.is(removeMark)) {
			effects.push(addMark.of(effect.value));
		}

		else if (effect.is(startSnippet)) {
			effects.push(undidStartSnippet.of(null));
		}
		else if (effect.is(undidStartSnippet)) {
			effects.push(startSnippet.of(null));
		}
		else if (effect.is(endSnippet)) {
			effects.push(undidEndSnippet.of(null));
		}
		else if (effect.is(undidEndSnippet)) {
			effects.push(endSnippet.of(null));
		}
	}


	return effects;
});


export const handleUndoRedo = (update: ViewUpdate) => {
	const undoTr = update.transactions.find(tr => tr.isUserEvent("undo"));
	const redoTr = update.transactions.find(tr => tr.isUserEvent("redo"));


	for (const tr of update.transactions) {
		for (const effect of tr.effects) {

			if (effect.is(startSnippet)) {
				if (redoTr) {
					// Redo the addition of marks, tabstop expansion, and selection
					redo(update.view);
					redo(update.view);
					redo(update.view);
				}
			}
			else if (effect.is(undidEndSnippet)) {
				if (undoTr) {
					// Undo the addition of marks, tabstop expansion, and selection
					undo(update.view);
					undo(update.view);
					undo(update.view);
				}
			}
		}
	}

	if (undoTr) {
		removeEmptyTabstops(update.view);
	}
};
