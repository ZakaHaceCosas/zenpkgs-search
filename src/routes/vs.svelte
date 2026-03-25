<script lang="ts">
    import type { TreeRow, Obj, TAppState } from "$lib/types";
    import { onMount } from "svelte";
    const escapeHTML = (str: string) => {
        if (!str) return "";
        return str
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    const isMatch = (key: string, str: string) => {
        return key.toLowerCase().includes(str.toLowerCase());
    };
    function buildVisibleTree(
        data: Record<string, Obj>,
        expanded: Set<string>,
        query: string
    ): TreeRow[] {
        const result: TreeRow[] = [];

        function walk(obj: Record<string, Obj>, depth = 0, path: string[] = []) {
            console.log("Walking", obj);
            for (const [key, value] of Object.entries(obj)) {
                const fullKey = [...path, key].join(".");

                const hasChildren = !!value.sub;
                const isExpanded = expanded.has(fullKey);

                result.push({
                    key: fullKey,
                    item: value.meta,
                    depth,
                    hasChildren,
                    type: value.meta?.type,
                    expanded: isExpanded,
                    isMatch: query ? isMatch(key, query) : false
                });

                if (hasChildren && isExpanded) {
                    walk(value.sub!, depth + 1, [...path, key]);
                }
            }
        }

        walk(data);
        return result;
    }

    let {
        data,
        rowHeight = 28,
        appState,
        query
    } = $props<{
        data: Record<string, Obj>;
        rowHeight?: number;
        appState: TAppState;
        query: string;
    }>();

    let expanded = new Set<string>();
    let rows: TreeRow[] = $state([]);

    // virtual scroll state
    let container: HTMLDivElement;
    let scrollTop = 0;
    let viewportHeight = 0;

    const buffer = 5;

    // rebuild rows when expanded changes
    function rebuild() {
        rows = buildVisibleTree(data, expanded, query);
    }

    $effect(() => {
        console.log(rows);
    });

    function toggle(key: string) {
        if (expanded.has(key)) {
            expanded.delete(key);
        } else {
            expanded.add(key);
        }
        rebuild();
    }

    // virtual calculations (TODO)
    let startIndex = 0; // $derived(Math.max(0, Math.floor(scrollTop / rowHeight) - buffer));
    /* let endIndex = $derived(
        Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / rowHeight) + buffer)
    ); */
    let visibleRows = $derived(rows); // $derived(rows.slice(startIndex, endIndex));

    function handleScroll() {
        scrollTop = container.scrollTop;
    }

    onMount(() => {
        viewportHeight = container.clientHeight;
        rebuild();
    });
</script>

<div class="tree-root virtual-container" bind:this={container} onscroll={handleScroll}>
    <div class="virtual-viewport" style="height: {rows.length * rowHeight}px">
        {#each visibleRows as row, i}
            <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
            <div
                class="virtual-row tree-row"
                style="top: {(startIndex + i) *
                    rowHeight}px; height: {rowHeight}px; padding-left: {row.depth * 16}px"
                class:selected={appState.focusedRow?.path === row.key &&
                    appState.focusedRow?.type === row.type}
                class:search-leaf-match={row.isMatch}
                onclick={() => row.hasChildren && toggle(row.key)}
            >
                <div class="row-icon expanded">
                    {row.hasChildren ? (row.expanded ? "▼" : "▶") : "●"}
                </div>

                <div class="row-label">
                    <span class="label">
                        {@html row.isMatch
                            ? row.key
                                  .split(".")
                                  .at(-1)!
                                  .replace(new RegExp(query, "i"), (m) => `<b>${m}</b>`)
                            : escapeHTML(row.key.split(".").at(-1)!)}
                    </span>

                    {#if row.item}
                        <span class="desc">
                            — {row.item.description}
                            ({row.item.type})
                        </span>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
</div>

<!-- IDEALLY CODE FROM HERE SHOULD BE IMPLEMENTED IN THE NEW THING <div
                                    class="virtual-row"
                                    style="padding-left: {16 + item.level * 20}px"
                                    class:selected={appState.focusedRow?.path === item.path &&
                                        appState.focusedRow?.type === item.type}
                                    class:search-leaf-match={item.isMatch}
                                >
                                    {@html `
          <div class="row-icon ${item.sub ? "expanded" : "leaf"}">
            ${item.sub ? "▶" : "●"}
          </div>
          <div class="row-label">
            ${
                item.isMatch
                    ? item.key.replace(new RegExp(query, "i"), (match: string) => `<b>${match}</b>`)
                    : escapeHTML(item.key)
            }
          </div>
        `}
                                </div>-->
