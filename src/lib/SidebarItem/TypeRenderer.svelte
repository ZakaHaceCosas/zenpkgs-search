<script lang="ts">
    import type { TItem } from "../types";

    const { dataType } = $props<{ dataType: TItem["type"] }>();

    const isEnum = $derived(dataType && typeof dataType == "object");

    const idx = $derived(
        (dataType as TItem["type"]) == "Open Submodule Of (Attribute Set)"
            ? "unknown"
            : isEnum
              ? "enum"
              : (dataType ?? "null")
    );

    const icons = {
        boolean: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`,
        string: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>`,
        array: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
        set: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M3 12h1m8-9v1m8 8h1M5.6 5.6l.7.7m12.1-.7l-.7.7m0 11.4l.7.7m-12.1-.7l-.7.7"/></svg>`,
        number: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/></svg>`,
        enum: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
        null: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>`,
        function: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>`,
        unknown: `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
    };
</script>

<div class="adw-group-title" style="margin-left:24px;">Type</div>
<div class="adw-group" style="margin: 0 12px 24px 12px;">
    <div class="adw-row" style="padding: 10px 16px; min-height: 44px;">
        <div style="display:flex; align-items:center; gap:8px; font-weight:600; font-size:0.9rem">
            {@html icons[idx as "boolean"]}
            <span style="text-transform:capitalize"
                >{#if isEnum}Enum{:else}{dataType}{/if}</span
            >
        </div>
    </div>
</div>
