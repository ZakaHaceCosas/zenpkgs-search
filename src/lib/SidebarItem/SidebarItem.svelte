<script lang="ts">
    import Maintainer from "$lib/Maintainer.svelte";
    import { addToScratchpad, copyToClipboard, queryFavorites, toggleFavorite } from "$lib/toolkit";
    import type { TObj, TAppState } from "$lib/types";
    import TypeRenderer from "./TypeRenderer.svelte";
    import { marked } from "marked";

    const { focusedRow, selectedRow, appState } = $props<{
        focusedRow: TAppState["focusedRow"];
        selectedRow: TObj["meta"] | null;
        appState: TAppState;
    }>();

    let isFavorite = $derived(queryFavorites(appState, focusedRow));
    const favorite = () => {
        isFavorite = toggleFavorite(appState, focusedRow);
    };
</script>

<div class="sidebar-content" id="sidebar-body">
    <div
        class="adw-group-title"
        style="margin-top:12px; margin-left:24px; display:flex; justify-content:space-between; align-items:center; padding-right:12px"
    >
        <span>Identifier</span>
        <button class="adw-button icon-only" onclick={favorite} title="Pin">
            <svg
                width="16"
                height="16"
                fill={isFavorite ? "#fff" : "none"}
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
                ><path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                ></path></svg
            >
        </button>
    </div>
    <div class="adw-group" style="margin: 0 12px 24px 12px;">
        <div
            class="adw-row"
            style="flex-direction: column; align-items: flex-start; gap: 12px; border-bottom:none;"
        >
            <div
                style="font-family:var(--font-mono); font-size:0.85rem; word-break:break-all;"
                id="inspector-id-text"
            >
                {focusedRow}
            </div>
            <div style="display:flex; gap:8px; width:100%; justify-content:center;">
                <div
                    class="maintainer-chip"
                    style="background:var(--accent-bg); color:var(--accent-fg); flex:0 0 auto; min-width:140px; justify-content:center; text-align:center"
                    onclick={() => addToScratchpad(focusedRow)}
                >
                    + Add to Scratchpad
                </div>
                <div
                    class="maintainer-chip"
                    style="background:var(--accent-bg); color:var(--accent-fg); flex:0 0 auto; min-width:100px; justify-content:center; text-align:center"
                    onclick={() => copyToClipboard(focusedRow)}
                >
                    Copy ID
                </div>
            </div>
        </div>
    </div>
    {#if selectedRow?.type}
        <TypeRenderer dataType={selectedRow.type} />
    {/if}
    {#if selectedRow?.description}
        <div class="adw-group-title" style="margin-left:24px;">Description</div>
        <div class="adw-group" style="margin: 0 12px 24px 12px;">
            <div
                class="adw-row"
                style="cursor:default; padding:16px; color:var(--text-color)"
                id="inspector-desc-text"
            >
                {selectedRow.description}
            </div>
        </div>
    {/if}
    {#if selectedRow?.maintainers && selectedRow.maintainers.length != 0}
        <div class="adw-group-title" style="margin-left:24px;">Maintainers</div>
        {#each selectedRow.maintainers as maintainer}
            <div class="chip-grid" style="padding: 0 12px; margin-bottom:24px;">
                <Maintainer {maintainer} {appState} />
            </div>
        {/each}
    {/if}
    <!--TODO: markdown rendering-->
    {#if selectedRow?.longDescription}
        <div class="adw-group-title" style="margin-left:24px;">Documentation</div>
        <div class="markdown-body" style="margin: 0 12px 24px 12px;">
            {@html marked(selectedRow.longDescription)}
        </div>
    {/if}
</div>
