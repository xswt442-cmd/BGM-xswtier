import { setAriaStrings } from 'svelte-dnd-action';
import * as m from '$lib/paraglide/messages';

/** 把库的读屏/键盘拖拽公告接到当前语言。语言切换时需重新调用（静态指令串会重渲染）。 */
export function applyAriaStrings() {
	setAriaStrings({
		dragStarted: ({ itemLabel, zoneLabel }) => m.aria_drag_started({ itemLabel, zoneLabel }),
		movedToPosition: ({ itemLabel, zoneLabel, position }) =>
			m.aria_moved_to_position({ itemLabel, zoneLabel, position }),
		movedToZoneEnd: ({ itemLabel, zoneLabel }) => m.aria_moved_to_zone_end({ itemLabel, zoneLabel }),
		movedToZoneStart: ({ itemLabel, zoneLabel }) => m.aria_moved_to_zone_start({ itemLabel, zoneLabel }),
		dropped: ({ itemLabel }) => m.aria_dropped({ itemLabel }),
		zoneActiveInstruction: m.aria_zone_active(),
		zoneDragDisabledInstruction: m.aria_zone_disabled(),
	});
}
