<script lang="ts">
    import type { TAppState, TMaintainer } from "./types";

    const {
        maintainer,
        appState
    }: {
        maintainer: string;
        appState: TAppState;
    } = $props();

    $inspect("MAINTAINERS ---", appState.data?.maintainers);

    const m: TMaintainer | null = $derived(
        appState.data
            ? (Object.entries(appState.data.maintainers).find((i) => i[0] == maintainer)?.[1] ??
                  null)
            : null
    );
    let showPopup: boolean = $state<boolean>(false);
    let chip: HTMLDivElement | undefined = $state(undefined);
    let popup: HTMLDivElement | undefined = $state(undefined);
    let coords: { bottom: number; left: number } | undefined = $state(undefined);

    $effect(() => {
        if (m != null) {
            console.log("runs?");
            const rawChipCoords = chip?.getBoundingClientRect();
            const rawPopupCoords = popup?.getBoundingClientRect();
            if (!rawChipCoords || !rawPopupCoords) return;
            console.log(
                "DEBUG",
                m?.name,
                "- chip height:",
                rawChipCoords.height,
                "popup height:",
                rawPopupCoords.height,
                "chip top:",
                rawChipCoords.top,
                "popup top:",
                rawPopupCoords.top
            );
            const bottom = (window.innerHeight - rawChipCoords.bottom) / 2 - 30;
            console.log(
                "WINDOW",
                window.innerHeight,
                rawChipCoords.top,
                window.innerHeight - rawChipCoords.top
            );
            const left =
                rawChipCoords.left + rawChipCoords.width / 2 - rawPopupCoords.width / 2 - 10;

            coords = { bottom, left };
        }
    });

    $inspect("COORDS", m?.name ?? "(idk who)", coords);

    const click = () => (showPopup = !showPopup);
</script>

{#if m}
    <div
        id="maintainer-popup"
        class="popover-inner common-popover {showPopup ? 'visible' : ''}"
        style="{coords
            ? `bottom: ${coords.bottom}px; left: ${coords.left}px;`
            : ''} --pop-start: scale(0.9)"
        bind:this={popup}
    >
        <div
            class="popup-arrow arrow-down"
            id="mp-arrow"
            style="left: 120px; transform: translateX(-50%);"
        ></div>
        <div
            id="mp-content"
            style="padding: 16px; gap: 10px; display: flex;flex-direction: column;"
        >
            <div
                style="border-bottom:1px solid var(--border-color); padding-bottom:8px;  display:flex; justify-content:space-between; align-items:center"
            >
                <span style="font-weight:800; font-size:1rem">{m.name}</span>
                <span
                    style="font-size:0.65rem; font-weight:800; background:color-mix(in srgb, var(--accent-bg) 20%, var(--bg-modal)); color:var(--link-color); padding:2px 6px; border-radius:4px"
                    >{m.role}</span
                >
            </div>
            {#each Object.entries(m).filter((v) => !["name", "role"].includes(v[0])) as kv, i (i)}
                <div
                    class="maintainer-row"
                    style="display:flex; justify-content:space-between; margin-bottom:4px; flex-direction:column; gap:4px;"
                >
                    <div class="maintainer-label" style="text-align:left">{kv[0]}</div>
                    <div class="maintainer-value">{kv[1]}</div>
                </div>
            {/each}
        </div>
    </div>
    <div
        class="maintainer-chip"
        role="button"
        tabindex="0"
        onclick={click}
        onkeydown={(e) => e.key === "Enter" && click()}
        bind:this={chip}
    >
        {m.name}
    </div>
{/if}
