<script lang="ts">
    import { onMount } from "svelte";
    import VirtualScroller from "./vs.svelte";
    import {
        type VisibleType,
        type TOptionsData,
        type ColorString,
        type KeybindString,
        ColorStrings,
        type TPkgsData,
        type TAppState,
        type Obj
    } from "$lib/types";
    import TypeRenderer from "$lib/SidebarItem/TypeRenderer.svelte";
    import SidebarItem from "$lib/SidebarItem/SidebarItem.svelte";

    const modals = $state<Record<VisibleType, boolean>>({
        MAbout: false,
        MSettings: false,
        PMenu: false,
        ILoader: false,
        IScratchpad: false
    });
    let appState = $state<TAppState>({
        searching: false,
        previewedNews: null,
        unreadLatest: false,
        query: "",
        diffSelecting: false,
        diffMode: false,
        diffBaseData: null,
        diffBaseVersion: null,
        currentNewsContent: null,
        newsArchive: [],
        advancedScratchpad: true,
        searchMatchIndex: -1,
        data: null,
        versions: [],
        selectedVersion: null,
        dark: true,
        accent: "purple",
        reducedMotion: false,
        transparency: 0.06,
        ghToken: "",
        geminiKey: "",
        customFont: "",
        customCSS: "",
        focusedRow: null,
        comboTimeout: 500,
        currentMeta: null,
        favorites: [],
        recents: [],
        searchHistory: [],
        commandHistory: [],
        scratchpadConfig: "",
        favsCollapsed: false,
        keybinds: {
            search: "Ctrl+f",
            up: "ArrowUp",
            down: "ArrowDown",
            left: "ArrowLeft",
            right: "ArrowRight",
            copyId: "Ctrl+c",
            copyDesc: "Ctrl+Shift+c",
            version: "Ctrl+,",
            settings: "Ctrl+.",
            about: "Ctrl+Shift+a",
            top: "g g",
            bottom: "Shift+g",
            nextMatch: "Ctrl+g",
            prevMatch: "Ctrl+Shift+g"
        }
    });
    const dataConfig = $state({ OWNER: "zenos-n", REPO: "zenpkgs", BRANCH: "json" });
    let loading = $state(true);

    const toggleVisible = (id: VisibleType) => {
        modals[id] = !modals[id];
    };
    function updateNewsBadges(latestNewsId: string) {
        const lastRead = localStorage.getItem("zenpkgs_news_id");
        const isNew = lastRead !== latestNewsId;
        appState.unreadLatest = !isNew;
    }

    function queryRow(row: string | null): Obj["meta"] | null {
        if (!row || !appState.data) return null;

        const parts = row.split(".");
        const prefix = parts.shift() as "options" | "pkgs";

        let current: Obj | undefined = appState.data[prefix];

        for (const key of parts) {
            if (!current) return null;

            const next: Obj | undefined = current.sub ? current.sub[key] : (current as any)[key];

            if (!next) return null;
            current = next;
        }

        $inspect("CURR", current);
        return current?.meta || null;
    }

    const selectedRow: Obj["meta"] | null = $derived(queryRow(appState.focusedRow));

    $effect(() => {
        if (!appState.focusedRow) fetchNews(false).then(() => {});
    });

    export async function fetchNews(previewMode = false, specificFile = null) {
        try {
            const baseUrl = `https://raw.githubusercontent.com/${dataConfig.OWNER}/${dataConfig.REPO}/news`;
            const url = specificFile
                ? `${baseUrl}/${specificFile}`
                : `${baseUrl}/latest.json?nocache=${Date.now()}`;

            const res = await fetch(url);
            console.log(res);
            if (!res.ok) return;
            const news = await res.json();

            if (previewMode) {
                if (!specificFile) updateNewsBadges(news.id);
                appState.previewedNews = news[0];
                return;
            }

            appState.currentNewsContent = news.content;
            appState.previewedNews = news;

            /* if (specificFile) {
                newsNav.renderArticle(news, "news-body-archive-entry", false);
                newsNav.goToEntry(specificFile);
            } else {
                updateNewsBadges(news.id);
                newsNav.renderArticle(news, "news-body-latest", true);
                newsNav.goToLatest();

                if (appState.newsArchive.length === 0) {
                    const listUrl = `https://api.github.com/repos/${dataConfig.OWNER}/${dataConfig.REPO}/contents?ref=news`;
                    fetch(listUrl, {
                        headers: appState.ghToken ? { Authorization: `Bearer ${appState.ghToken}` } : {}
                    })
                        .then((r) => r.json())
                        .then((files) => {
                            if (Array.isArray(files))
                                appState.newsArchive = files
                                    .filter(
                                        (f) => f.name.endsWith(".json") && f.name !== "latest.json"
                                    )
                                    .sort((a, b) => b.name.localeCompare(a.name));
                        });
                }
            } */
        } catch (e) {
            console.error("News Error:", e);
        }
    }

    async function fetchWithAuth(url: string) {
        const headers = new Headers();
        if (appState.ghToken) headers.append("Authorization", `Bearer ${appState.ghToken}`);
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
    }

    async function loadSettings() {
        const preferences = localStorage.getItem("preferences");
        const history = localStorage.getItem("history");
        const recents = localStorage.getItem("recents");
        const favorites = localStorage.getItem("favorites");

        if (preferences) {
            appState = {
                ...appState
                // preferences: JSON.parse(preferences)
            };
        }
        if (recents) {
            appState = {
                ...appState,
                recents: JSON.parse(recents)
            };
        }
        if (favorites) {
            appState = {
                ...appState,
                favorites: JSON.parse(favorites)
            };
        }
        if (history) {
            appState = {
                ...appState
                // history: JSON.parse(history)
            };
            toggleVisible("IScratchpad");
        }
    }

    async function init() {
        toggleVisible("ILoader");
        await loadSettings();

        const cachedReleases = localStorage.getItem("releases_list");
        if (cachedReleases) appState.versions = JSON.parse(cachedReleases);

        let initialMeta = null;
        loading = true;

        const metaRes = await fetchWithAuth(
            `https://raw.githubusercontent.com/${dataConfig.OWNER}/${dataConfig.REPO}/${dataConfig.BRANCH}/latestCommit.json`
        );
        initialMeta = await metaRes.json();
        console.error("INIT META", initialMeta);
        if (initialMeta.options || initialMeta.pkgs) {
            appState.data = initialMeta;
            appState.selectedVersion = "Latest commit";
        }
        toggleVisible("ILoader");
    }

    onMount(async () => {
        await init();
        loading = false;
    });

    const colorMap: Record<ColorString, string> = {
        blue: "#3584e4",
        teal: "#2190a4",
        green: "#3a944a",
        yellow: "#c88800",
        orange: "#ed5b00",
        red: "#e62d42",
        pink: "#d56199",
        purple: "#9141ac",
        slate: "#6f8396"
    };

    $effect(() =>
        document.documentElement.style.setProperty(
            "--accent-bg",
            colorMap[appState.accent],
            "important"
        )
    );
    $inspect("AppState", appState);

    function getBranchItems(catKey: "options" | "pkgs"): TOptionsData | TPkgsData {
        if (!appState.data || !appState.data[catKey]) return {};
        const a = appState.data[catKey];
        $inspect("GetBranchItems>", a);
        return a;
    }
</script>

{#if loading == true}
    <div class="loader-container" id="loader">
        <div class="spinner"></div>
        <div>Fetching Registry...</div>
    </div>
{:else}
    <div class="sheet-backdrop" id="sheet-backdrop"></div>
    <div class="pane-left">
        <div class="header-bar">
            <button
                class="adw-button icon-only"
                title="Search"
                onclick={() => (appState.searching = !appState.searching)}
            >
                <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    viewBox="0 0 24 24"
                    ><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg
                >
            </button>
            <div class="header-brand">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <g clip-path="url(#clip0_272_121)"
                        ><path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M12.5 7C10.567 7 9 5.433 9 3.5C9 1.567 10.567 0 12.5 0C14.433 0 16 1.567 16 3.5C16 5.433 14.433 7 12.5 7ZM12.5 1.5C13.6046 1.5 14.5 2.39543 14.5 3.5C14.5 4.60457 13.6046 5.5 12.5 5.5C11.3954 5.5 10.5 4.60457 10.5 3.5C10.5 2.39543 11.3954 1.5 12.5 1.5Z"
                        /><path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M12.5 16C10.567 16 9 14.433 9 12.5C9 10.567 10.567 9 12.5 9C14.433 9 16 10.567 16 12.5C16 14.433 14.433 16 12.5 16ZM12.5 10.5C13.6046 10.5 14.5 11.3954 14.5 12.5C14.5 13.6046 13.6046 14.5 12.5 14.5C11.3954 14.5 10.5 13.6046 10.5 12.5C10.5 11.3954 11.3954 10.5 12.5 10.5Z"
                        /><path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M3.5 11.5C1.567 11.5 0 9.933 0 8C0 6.067 1.567 4.5 3.5 4.5C5.433 4.5 7 6.067 7 8C7 9.933 5.433 11.5 3.5 11.5ZM3.5 6C4.60457 6 5.5 6.89543 5.5 8C5.5 9.10457 4.60457 10 3.5 10C2.39543 10 1.5 9.10457 1.5 8C1.5 6.89543 2.39543 6 3.5 6Z"
                            fill="currentColor"
                        /></g
                    ><defs
                        ><clipPath id="clip0_272_121"
                            ><rect width="16" height="16" fill="currentColor" /></clipPath
                        ></defs
                    >
                </svg>
                <span>ZenPkgs</span>
            </div>
            <button
                class="adw-button icon-only"
                id="menu-btn"
                style="position: relative;"
                onclick={() => toggleVisible("PMenu")}
            >
                <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg
                >
                {#if appState.unreadLatest}
                    <div
                        id="btn-news-badge"
                        style="position:absolute; top:8px; right:8px; width:6px; height:6px; background:var(--accent-red); border-radius:50%; "
                    ></div>
                {/if}
            </button>
        </div>
        <div class="sidebar-content" id="sidebar-body">
            {#if appState.focusedRow == null}
                <div style="padding: 40px 0; text-align: center; color: var(--dim-label);">
                    <div style="margin-bottom: 16px; opacity: 0.1">
                        <svg width="80" height="80" fill="currentColor" viewBox="0 0 24 24"
                            ><path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                            ></path></svg
                        >
                    </div>
                    <div style="font-weight: 700; margin-bottom: 8px;">ZenPkgs Explorer</div>
                    <div style="font-size: 0.9rem; margin-bottom: 32px;">
                        Select an option to view details.
                    </div>

                    {#if appState.previewedNews}
                        <div id="start-news-preview" style="display: block;">
                            <div
                                class="news-card"
                                onclick={() => {
                                    toggleVisible("MAbout");
                                    fetchNews(false);
                                }}
                            >
                                {#if appState.unreadLatest}<div class="news-label-new">
                                        NEW
                                    </div>{/if}
                                <div
                                    style="font-weight:700; color:var(--text-color); font-size:1rem; margin-bottom:4px;"
                                >
                                    {appState.previewedNews.title}
                                </div>
                                <div
                                    style="font-size:0.8rem; color:var(--dim-label); margin-bottom:12px;"
                                >
                                    {appState.previewedNews.date}
                                </div>
                                <div
                                    style="font-size:0.85rem; color:var(--link-color); font-weight:700; display:flex; align-items:center; gap:4px;"
                                >
                                    Read Article
                                    <svg
                                        width="12"
                                        height="12"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2.5"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M5 12h14M12 5l7 7-7 7"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <div
                        style="font-size: 0.75rem; margin-top: 24px; color: var(--secondary-label); padding: 0 20px;"
                    >
                        <code>Ctrl+F</code> to search<br />
                        <code>ArrowUp/ArrowDown</code> to navigate
                    </div>
                    <div style="text-align:left; margin-top:32px; padding: 0 20px;">
                        <div class="adw-group-title" style="margin-left:0; text-align:left;">
                            Recent
                        </div>
                        <div class="adw-group">
                            {#each appState.recents as recent}
                                <div
                                    class="adw-row"
                                    style="cursor:pointer"
                                    onclick={() => (appState.focusedRow = recent)}
                                >
                                    <span style="font-weight:600; font-size:0.9em">{recent}</span>
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {:else}
                <SidebarItem focusedRow={appState.focusedRow} {selectedRow} {appState} />
            {/if}
        </div>
    </div>

    <div class="pane-right">
        <div class="header-bar">
            <div class="mobile-header-bar">
                <div class="search-wrapper" id="search-bar-mobile">
                    <input
                        type="text"
                        class="adw-search"
                        id="search-input-mobile"
                        placeholder="Search registry..."
                    />
                    <div id="search-history"></div>
                </div>

                <button class="adw-button icon-only mobile-nav-btn">
                    <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg
                    >
                    <div
                        id="mobile-menu-badge"
                        style="position:absolute; top:8px; right:8px; width:6px; height:6px; background:var(--accent-red); border-radius:50%; display:none;"
                    ></div>
                </button>

                <div class="header-brand mobile-nav-brand">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        ><g clip-path="url(#clip0_272_121)"
                            ><path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M12.5 7C10.567 7 9 5.433 9 3.5C9 1.567 10.567 0 12.5 0C14.433 0 16 1.567 16 3.5C16 5.433 14.433 7 12.5 7ZM12.5 1.5C13.6046 1.5 14.5 2.39543 14.5 3.5C14.5 4.60457 13.6046 5.5 12.5 5.5C11.3954 5.5 10.5 4.60457 10.5 3.5C10.5 2.39543 11.3954 1.5 12.5 1.5Z"
                                fill="currentColor"
                            /><path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M12.5 16C10.567 16 9 14.433 9 12.5C9 10.567 10.567 9 12.5 9C14.433 9 16 10.567 16 12.5C16 14.433 14.433 16 12.5 16ZM12.5 10.5C13.6046 10.5 14.5 11.3954 14.5 12.5C14.5 13.6046 13.6046 14.5 12.5 14.5C11.3954 14.5 10.5 13.6046 10.5 12.5C10.5 11.3954 11.3954 10.5 12.5 10.5Z"
                                fill="currentColor"
                            /><path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M3.5 11.5C1.567 11.5 0 9.933 0 8C0 6.067 1.567 4.5 3.5 4.5C5.433 4.5 7 6.067 7 8C7 9.933 5.433 11.5 3.5 11.5ZM3.5 6C4.60457 6 5.5 6.89543 5.5 8C5.5 9.10457 4.60457 10 3.5 10C2.39543 10 1.5 9.10457 1.5 8C1.5 6.89543 2.39543 6 3.5 6Z"
                                fill="currentColor"
                            /></g
                        ></svg
                    >
                    <span>ZenPkgs</span>
                </div>

                <button class="adw-button icon-only mobile-nav-btn">
                    <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        viewBox="0 0 24 24"
                        ><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg
                    >
                </button>
            </div>

            <div class="header-bar-center-stack">
                <div class="header-bar-center-stack">
                    <div class="breadcrumbs-wrapper" id="breadcrumbs">
                        <div class="crumb-btn" onclick={(appState.focusedRow = null)}>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="var(--dim-label)"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <g clip-path="url(#clip0_272_121)"
                                    ><path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M12.5 7C10.567 7 9 5.433 9 3.5C9 1.567 10.567 0 12.5 0C14.433 0 16 1.567 16 3.5C16 5.433 14.433 7 12.5 7ZM12.5 1.5C13.6046 1.5 14.5 2.39543 14.5 3.5C14.5 4.60457 13.6046 5.5 12.5 5.5C11.3954 5.5 10.5 4.60457 10.5 3.5C10.5 2.39543 11.3954 1.5 12.5 1.5Z"
                                    ></path><path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M12.5 16C10.567 16 9 14.433 9 12.5C9 10.567 10.567 9 12.5 9C14.433 9 16 10.567 16 12.5C16 14.433 14.433 16 12.5 16ZM12.5 10.5C13.6046 10.5 14.5 11.3954 14.5 12.5C14.5 13.6046 13.6046 14.5 12.5 14.5C11.3954 14.5 10.5 13.6046 10.5 12.5C10.5 11.3954 11.3954 10.5 12.5 10.5Z"
                                    ></path><path
                                        fill-rule="evenodd"
                                        clip-rule="evenodd"
                                        d="M3.5 11.5C1.567 11.5 0 9.933 0 8C0 6.067 1.567 4.5 3.5 4.5C5.433 4.5 7 6.067 7 8C7 9.933 5.433 11.5 3.5 11.5ZM3.5 6C4.60457 6 5.5 6.89543 5.5 8C5.5 9.10457 4.60457 10 3.5 10C2.39543 10 1.5 9.10457 1.5 8C1.5 6.89543 2.39543 6 3.5 6Z"
                                        fill="currentColor"
                                    ></path></g
                                ><defs
                                    ><clipPath id="clip0_272_121"
                                        ><rect width="16" height="16" fill="currentColor"
                                        ></rect></clipPath
                                    ></defs
                                >
                            </svg><span>zenpkgs</span>
                        </div>
                        {#if appState.focusedRow != null}
                            {#each (appState.focusedRow as any).split(".") as key, idx}
                                <span class="crumb-sep">›</span>
                                <div
                                    class="crumb-btn"
                                    class:active={idx == appState.focusedRow!.split(".").length - 1}
                                    onclick={(appState.focusedRow = null)}
                                >
                                    <span>{key}</span>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </div>
                <div
                    class={appState.searching ? "search-wrapper visible" : "search-wrapper"}
                    id="search-bar"
                >
                    <input
                        type="text"
                        class="adw-search"
                        id="search-input"
                        placeholder="Search registry..."
                        value={appState.query}
                        oninput={(e) => (appState.query = e.currentTarget.value.trim())}
                    />
                    <div id="search-history"></div>
                </div>

                <!-- Surprise Me Button -->
                <button class="adw-button icon-only" title="Surprise Me (Random Package)">
                    <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                        ><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l5 5M4 4l5 5" /></svg
                    >
                </button>

                <!-- Modified Version Button containing Status Indicator -->
                <button class="version-trigger" id="version-btn">
                    <div class="offline-indicator" id="net-status" title="Online"></div>
                    <span id="current-version">{appState.selectedVersion}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
                        ><path d="M7 10l5 5 5-5z" /></svg
                    >
                </button>

                <div id="version-dropdown">
                    <div class="popover-inner">
                        <div class="version-list" id="version-list-container"></div>
                        <div class="version-footer">
                            <input
                                type="file"
                                id="universal-json-upload"
                                style="display: none;"
                                accept=".json"
                            />

                            <!-- 1. DIFF TOGGLE -->
                            <button
                                class="refresh-btn"
                                id="btn-diff-toggle"
                                title="Toggle Diff Selection Mode"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 16 16"
                                >
                                    <!-- Document Outline -->
                                    <path
                                        d="M3.5 2C3.5 1.44772 3.94772 1 4.5 1H10.5L13.5 4V14C13.5 14.5523 13.0523 15 12.5 15H4.5C3.94772 15 3.5 14.5523 3.5 14V2Z"
                                        stroke-width="1.5"
                                    />
                                    <!-- Plus (Top) -->
                                    <path
                                        d="M8.5 4V8M6.5 6H10.5"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                    <!-- Minus (Bottom) -->
                                    <path
                                        d="M6.5 11H10.5"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                    />
                                </svg>
                                Diff
                            </button>

                            <!-- 2. UPLOAD -->
                            <button class="refresh-btn" title="Upload JSON">
                                <svg
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    viewBox="0 0 24 24"
                                    ><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
                                        points="17 8 12 3 7 8"
                                    /><line x1="12" y1="3" x2="12" y2="15" /></svg
                                >
                                Upload
                            </button>

                            <!-- 3. RELOAD -->
                            <button
                                style="max-width: 34px"
                                class="refresh-btn icon-only"
                                id="refresh-releases-btn"
                                title="Refresh Versions"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    viewBox="0 0 24 24"
                                    ><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path
                                        d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"
                                    /><path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg
                                >
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="main-content">
            <div class="content-container">
                <div id="registry-root">
                    {#each ["options", "pkgs"] as const as catKey}
                        <div class="adw-group-title">
                            {{ options: "Nix Options", pkgs: "Packages" }[catKey]}
                        </div>
                        <VirtualScroller
                            data={getBranchItems(catKey)}
                            branch={catKey}
                            rowHeight={50}
                            {appState}
                        />
                    {/each}
                    <div class="adw-group-title">MAINTAINERS</div>
                    <div class="chip-grid">
                        {#each Object.keys(appState.data!.maintainers) as mnt}
                            <div class="maintainer-chip">{mnt}</div>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scratchpad FAB & Panel -->
    <button id="scratchpad-fab" onclick={() => toggleVisible("IScratchpad")}>
        <svg viewBox="0 0 24 24"
            ><path
                d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"
            /></svg
        >
    </button>
    <div id="scratchpad-panel" class={modals["IScratchpad"] === true ? "visible" : ""}>
        <div class="sp-header">
            <span>Config Scratchpad</span>
            <button class="window-close-button"
                ><svg width="8" height="8" viewBox="0 0 8 8" fill="none"
                    ><path
                        d="M2.5 4L0 1.5V0H1.5L4 2.5L6.5 0H8V1.5L5.5 4L8 6.5V8H6.5L4 5.5L1.5 8H0V6.5L2.5 4Z"
                        fill="currentColor"
                    /></svg
                ></button
            >
        </div>
        <div id="sp-editor-container">
            <div id="sp-visual-view" contenteditable="true" spellcheck="false">
                # Your generated config will appear here...
            </div>
        </div>

        <div id="sp-input-popover">
            <div class="sp-pop-header"><span id="sp-pop-title">Edit Value</span></div>
            <div class="sp-pop-body">
                <!-- List Container (Hidden by default) -->
                <div
                    id="sp-list-container"
                    style="display:none; flex-wrap:wrap;  max-height:120px; overflow-y:auto;"
                ></div>

                <div style="display:flex; gap:6px; align-items:center;">
                    <!-- Number Stepper Minus -->
                    <button
                        id="sp-btn-minus"
                        class="adw-button icon-only"
                        style="display:none; flex-shrink:0; width:32px;">-</button
                    >

                    <!-- Main Input -->
                    <input
                        type="text"
                        class="adw-input"
                        id="sp-badge-input"
                        placeholder="Enter value..."
                        autocomplete="off"
                    />

                    <!-- Function Textarea -->
                    <textarea
                        class="adw-input"
                        id="sp-badge-textarea"
                        style="display:none; height:200px; font-family:var(--font-mono); font-size:0.85rem; line-height:1.4;"
                        placeholder="pkg: ..."
                    ></textarea>

                    <!-- Plus Button (Number/List) -->
                    <button
                        id="sp-btn-plus"
                        class="adw-button icon-only"
                        style="display:none; flex-shrink:0; width:32px;">+</button
                    >
                </div>
            </div>
            <div class="sp-pop-footer">
                <button class="adw-button destructive" style="flex:1; justify-content:center"
                    >Cancel</button
                >
                <button
                    class="adw-button"
                    style="flex:1; justify-content:center; background:var(--accent-bg); color:var(--accent-fg);"
                    >Apply</button
                >
            </div>
        </div>

        <div id="sp-enum-popover">
            <div class="sp-pop-header"><span>Select Option</span></div>
            <div
                class="sp-pop-body"
                id="sp-enum-list"
                style="padding: 6px; max-height: 200px; overflow-y: auto;"
            ></div>
        </div>
        <div class="sp-footer">
            <button class="adw-button" style="flex:1">Copy Config</button>
            <button class="adw-button destructive" style="flex:1"
                ><svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                    ><path
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    /></svg
                > Clear scratchpad</button
            >
        </div>
    </div>

    <!-- POPOVERS & MODALS -->
    <div
        id="menu-popover"
        class={"popover-inner common-popover " + (modals["PMenu"] === true ? "visible" : "")}
    >
        <div
            class="menu-item"
            onclick={() => {
                toggleVisible("MSettings");
                toggleVisible("PMenu");
            }}
            title="Open settings"
            aria-label="Button to open settings"
        >
            Settings <span style="opacity:0.5; font-size:0.8em; margin-left:8px">Ctrl+.</span>
        </div>
        <div class="menu-item">
            Keybinds <span style="opacity:0.5; font-size:0.8em; margin-left:8px">Ctrl+/</span>
        </div>
        <div class="menu-item">
            Developer News <span
                id="menu-news-badge"
                style="color:var(--accent-red); margin-left:4px;">●</span
            >
        </div>
        <div class="menu-item">
            Command Palette <span style="opacity:0.5; font-size:0.8em; margin-left:8px">Ctrl+K</span
            >
        </div>
        <div
            class="menu-item"
            onclick={() => {
                toggleVisible("MAbout");
                toggleVisible("PMenu");
            }}
        >
            About <span style="opacity:0.5; font-size:0.8em; margin-left:8px">Ctrl+Shift+A</span>
        </div>
    </div>

    <!-- COMMAND PALETTE MODAL -->
    <div class="overlay-backdrop" id="modal-palette">
        <div class="adw-window command-palette" style="width:600px">
            <div class="command-input-wrapper">
                <input
                    type="text"
                    class="command-input"
                    id="cmd-input"
                    placeholder="Type a command..."
                />
            </div>
            <div class="command-list" id="cmd-list">
                <!-- Items populated via JS -->
            </div>
        </div>
    </div>

    <div class="overlay-backdrop" id="modal-news">
        <div class="adw-window" style="width: 600px">
            <div class="dialog-header">
                <button class="adw-button icon-only" id="news-back-btn" style="visibility: hidden;">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="16px"
                        viewBox="0 0 16 16"
                        width="16px"
                        ><path
                            d="m 9.292969 13.707031 l -5 -5 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 l 5 -5 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 s 0.390625 1.023437 0 1.414062 l -4.292969 4.292969 l 4.292969 4.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 z m 0 0"
                            fill="currentColor"
                            fill-rule="evenodd"
                        /></svg
                    >
                </button>
                <span id="news-title">Developer News</span>
                <button class="window-close-button">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"
                        ><path
                            d="M2.5 4L0 1.5V0H1.5L4 2.5L6.5 0H8V1.5L5.5 4L8 6.5V8H6.5L4 5.5L1.5 8H0V6.5L2.5 4Z"
                            fill="currentColor"
                        /></svg
                    >
                </button>
            </div>
            <div class="window-content about-stack-container">
                <div id="news-page-latest" class="stack-page active">
                    <div id="news-body-latest"></div>
                </div>

                <div id="news-page-archive-list" class="stack-page off-right">
                    <div id="news-body-archive-list"></div>
                </div>

                <div id="news-page-archive-entry" class="stack-page off-right">
                    <div id="news-body-archive-entry"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- SETTINGS MODAL -->
    <div
        class={"overlay-backdrop " + (modals["MSettings"] === true ? "visible" : "")}
        id="modal-settings"
    >
        <div class="adw-window">
            <div class="dialog-header">
                <div style="width:24px"></div>
                <span>Settings</span>
                <button
                    class="window-close-button"
                    title="Close"
                    aria-label="Close this modal"
                    onclick={() => toggleVisible("MSettings")}
                >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"
                        ><path
                            d="M2.5 4L0 1.5V0H1.5L4 2.5L6.5 0H8V1.5L5.5 4L8 6.5V8H6.5L4 5.5L1.5 8H0V6.5L2.5 4Z"
                            fill="currentColor"
                        /></svg
                    >
                </button>
            </div>
            <div class="window-body">
                <div class="adw-group-title">Appearance</div>
                <div class="adw-group">
                    <div class="adw-row">
                        <span style="font-weight: 700;">Accent Color</span>
                        <div class="accent-picker">
                            {#each ColorStrings as color}
                                <label class="accent-option"
                                    ><input
                                        type="radio"
                                        name="accent"
                                        value={color}
                                        onchange={(e) =>
                                            (appState.accent = e.currentTarget
                                                .value as ColorString)}
                                        checked={appState.accent == color}
                                    /><span
                                        class="accent-circle"
                                        style={`--color: var(--accent-${color})`}
                                    ></span></label
                                >
                            {/each}
                        </div>
                    </div>
                    <div class="adw-row adw-switch-row" id="theme-row">
                        <span style="font-weight: 700;">Dark Mode</span>
                        <div class="switch-toggle"></div>
                    </div>
                    <div class="adw-row adw-switch-row" id="motion-row">
                        <span style="font-weight: 700;">Reduced Motion</span>
                        <div class="switch-toggle"></div>
                    </div>
                    <div
                        class="adw-row"
                        style="flex-direction: column; align-items: flex-start; gap: 8px;"
                    >
                        <span style="font-weight: 700;">Transparency</span>
                        <input
                            type="range"
                            class="adw-range"
                            min="0"
                            max="1"
                            step="0.05"
                            id="transparency-slider"
                        />
                    </div>
                    <div
                        class="adw-row"
                        style="flex-direction: column; align-items: flex-start; gap: 8px;"
                    >
                        <span style="font-weight: 700;">Custom Font Family</span>
                        <input
                            type="text"
                            class="adw-input"
                            id="custom-font-input"
                            placeholder="e.g. Inter, sans-serif"
                        />
                    </div>
                    <div
                        class="adw-row"
                        style="flex-direction: column; align-items: flex-start; gap: 8px;"
                    >
                        <span style="font-weight: 700;">Custom CSS</span>
                        <textarea
                            class="adw-input"
                            id="custom-css-input"
                            placeholder={".row-label { color: red !important; }"}
                        ></textarea>
                    </div>
                    <div class="adw-row adw-switch-row" id="sp-mode-row">
                        <span style="font-weight: 700;">Advanced Scratchpad (Badges)</span>
                        <div class="switch-toggle"></div>
                    </div>
                </div>

                <div class="adw-group-title">Keybinds</div>
                <div class="adw-group">
                    <div class="adw-row">
                        <span style="font-weight:700">Preset</span>
                        <select class="adw-select" id="kb-preset">
                            <option value="standard">Standard (Arrows)</option>
                            <option value="vim">Vim-like (hjkl)</option>
                            <option value="emacs">Emacs-like (pnbf)</option>
                        </select>
                    </div>
                    <div
                        class="adw-row"
                        style="flex-direction: column; align-items: flex-start; gap: 8px;"
                    >
                        <span style="font-weight: 700;">Combo Timeout (ms)</span>
                        <input
                            type="range"
                            class="adw-range"
                            min="100"
                            max="2000"
                            step="50"
                            id="combo-timeout-slider"
                        />
                        <span
                            style="font-size: 0.75rem; color: var(--dim-label)"
                            id="combo-timeout-val">500ms</span
                        >
                    </div>
                    <!-- Keybind inputs ... -->
                    <div class="adw-row">
                        <span>Search</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="search"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Up</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="up"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Down</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="down"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Left (Close/Parent)</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="left"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Right (Open/Child)</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="right"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Copy ID</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="copyId"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Copy Desc</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="copyDesc"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Switch Version</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="version"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Open Settings</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="settings"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Open About</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="about"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Go Top</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="top"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Go Bottom</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="bottom"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Next Match</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="nextMatch"
                            readonly
                        />
                    </div>
                    <div class="adw-row">
                        <span>Previous Match</span><input
                            type="text"
                            class="adw-input keybind-input"
                            data-bind="prevMatch"
                            readonly
                        />
                    </div>
                </div>

                <div class="adw-group-title">Connectivity</div>
                <div class="adw-group">
                    <div
                        class="adw-row"
                        style="flex-direction: column; align-items: flex-start; gap: 8px;"
                    >
                        <span style="font-weight: 700;">GitHub Token</span>
                        <input
                            type="password"
                            class="adw-input"
                            id="gh-token-input"
                            placeholder="ghp_..."
                        />
                        <span style="font-size: 0.75rem; color: var(--dim-label);"
                            >Used to increase API rate limits.</span
                        >
                    </div>
                </div>

                <div class="adw-group-title">Intelligence</div>
                <div class="adw-group">
                    <div
                        class="adw-row"
                        style="flex-direction: column; align-items: flex-start; gap: 8px;"
                    >
                        <span style="font-weight: 700;">Gemini API Key</span>
                        <input
                            type="password"
                            class="adw-input"
                            id="gemini-key-input"
                            placeholder="AIzaSy..."
                        />
                        <span style="font-size: 0.75rem; color: var(--dim-label);">
                            Required for Smart Assistant features.
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                style="color:var(--link-color)">Get a key from Google AI Studio</a
                            >
                        </span>
                    </div>
                </div>

                <div class="adw-group-title">Cache</div>
                <div class="adw-group">
                    <div class="adw-row">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-weight: 700;">Registry Data</span>
                            <span style="font-size: 0.75rem; color: var(--dim-label);"
                                ><span id="cache-stats">Calculating...</span></span
                            >
                        </div>
                        <button class="adw-button destructive">Clear Cache</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- KEYBINDS VIEW MODAL -->
    <div class="overlay-backdrop" id="modal-keybinds">
        <div class="adw-window" style="width:400px">
            <div class="dialog-header">
                <div style="width:24px"></div>
                <span>Keyboard Shortcuts</span>
                <button class="window-close-button">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"
                        ><path
                            d="M2.5 4L0 1.5V0H1.5L4 2.5L6.5 0H8V1.5L5.5 4L8 6.5V8H6.5L4 5.5L1.5 8H0V6.5L2.5 4Z"
                            fill="currentColor"
                        /></svg
                    >
                </button>
            </div>
            <div class="window-body" id="kb-view-content">
                <!-- Dynamically populated -->
            </div>
        </div>
    </div>

    <!-- ABOUT MODAL -->
    <div
        id="modal-about"
        class={"overlay-backdrop " + (modals["MAbout"] === true ? "visible" : "")}
    >
        <div class="adw-window" id="about-window" style="max-width: 400px; text-align: center;">
            <div class="dialog-header">
                <button
                    class="adw-button icon-only"
                    id="about-back-btn"
                    style="visibility: hidden;"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="16px"
                        viewBox="0 0 16 16"
                        width="16px"
                        ><path
                            d="m 9.292969 13.707031 l -5 -5 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 l 5 -5 c 0.390625 -0.390625 1.023437 -0.390625 1.414062 0 s 0.390625 1.023437 0 1.414062 l -4.292969 4.292969 l 4.292969 4.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 z m 0 0"
                            fill="currentColor"
                            fill-rule="evenodd"
                        /></svg
                    >
                </button>
                <span id="about-title" class="dialog-title">About</span>
                <button
                    class="window-close-button"
                    title="Close"
                    aria-label="Close this modal"
                    onclick={() => toggleVisible("MAbout")}
                >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"
                        ><path
                            d="M2.5 4L0 1.5V0H1.5L4 2.5L6.5 0H8V1.5L5.5 4L8 6.5V8H6.5L4 5.5L1.5 8H0V6.5L2.5 4Z"
                            fill="currentColor"
                        /></svg
                    >
                </button>
            </div>

            <div class="window-content about-stack-container">
                <!-- MAIN ABOUT PAGE -->
                <div id="about-main" class="stack-page active">
                    <div style="margin-bottom: 24px; display: flex; justify-content: center;">
                        <svg
                            width="80"
                            height="80"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <g clip-path="url(#clip0_272_121)"
                                ><path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M12.5 7C10.567 7 9 5.433 9 3.5C9 1.567 10.567 0 12.5 0C14.433 0 16 1.567 16 3.5C16 5.433 14.433 7 12.5 7ZM12.5 1.5C13.6046 1.5 14.5 2.39543 14.5 3.5C14.5 4.60457 13.6046 5.5 12.5 5.5C11.3954 5.5 10.5 4.60457 10.5 3.5C10.5 2.39543 11.3954 1.5 12.5 1.5Z"
                                    fill="currentColor"
                                /><path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M12.5 16C10.567 16 9 14.433 9 12.5C9 10.567 10.567 9 12.5 9C14.433 9 16 10.567 16 12.5C16 14.433 14.433 16 12.5 16ZM12.5 10.5C13.6046 10.5 14.5 11.3954 14.5 12.5C14.5 13.6046 13.6046 14.5 12.5 14.5C11.3954 14.5 10.5 13.6046 10.5 12.5C10.5 11.3954 11.3954 10.5 12.5 10.5Z"
                                    fill="currentColor"
                                /><path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M3.5 11.5C1.567 11.5 0 9.933 0 8C0 6.067 1.567 4.5 3.5 4.5C5.433 4.5 7 6.067 7 8C7 9.933 5.433 11.5 3.5 11.5ZM3.5 6C4.60457 6 5.5 6.89543 5.5 8C5.5 9.10457 4.60457 10 3.5 10C2.39543 10 1.5 9.10457 1.5 8C1.5 6.89543 2.39543 6 3.5 6Z"
                                    fill="currentColor"
                                /></g
                            ><defs
                                ><clipPath id="clip0_272_121"
                                    ><rect width="16" height="16" fill="white" /></clipPath
                                ></defs
                            >
                        </svg>
                    </div>
                    <div style="font-weight: 800; font-size: 1.5rem; margin-bottom: 8px;">
                        ZenPkgs Browser
                    </div>
                    <div style="margin-bottom: 24px;">
                        <span class="version-chip">v1.1.2</span>
                    </div>

                    <div class="adw-group">
                        <div class="adw-row" style="cursor: pointer;">
                            <div style="font-weight:700">Legal</div>
                            <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                viewBox="0 0 24 24"
                                style="opacity:0.5"><path d="M9 18l6-6-6-6" /></svg
                            >
                        </div>
                        <div class="adw-row" style="cursor: pointer;">
                            <div style="font-weight:700">Credits</div>
                            <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                viewBox="0 0 24 24"
                                style="opacity:0.5"><path d="M9 18l6-6-6-6" /></svg
                            >
                        </div>
                        <div class="adw-row">
                            <div style="font-weight:700">Registry Source</div>
                            <a href="https://github.com/zenos-n/zenpkgs" target="_blank">GitHub</a>
                        </div>
                        <div class="adw-row">
                            <div style="font-weight:700">Website Source</div>
                            <a href="https://github.com/zenos-n/zenpkgs-search" target="_blank"
                                >GitHub</a
                            >
                        </div>
                    </div>
                </div>

                <!-- LEGAL PAGE -->
                <div id="about-legal" class="stack-page off-right">
                    <div class="loader-container" id="legal-loader">
                        <div class="spinner"></div>
                        <div>Loading License...</div>
                    </div>
                    <div
                        id="legal-content"
                        class="markdown-body"
                        style="text-align: left; padding: 0;"
                    ></div>
                </div>

                <!-- CREDITS PAGE -->
                <div id="about-credits" class="stack-page off-right">
                    <div style="font-size: 0.9rem;">
                        <div class="adw-group-title">Core Team</div>
                        <div class="adw-group">
                            <div class="adw-row">
                                <span style="color:var(--secondary-label); font-size:0.85rem"
                                    >Lead Designer</span
                                >
                                <span style="font-weight:700">doromiert</span>
                            </div>
                            <div class="adw-row">
                                <span style="color:var(--secondary-label); font-size:0.85rem"
                                    >Developers</span
                                >
                                <span style="font-weight:700">CatNowBlue, Zaka</span>
                            </div>
                        </div>

                        <div class="adw-group-title">Special Thanks</div>
                        <div class="adw-group">
                            <div
                                class="adw-row"
                                style="flex-direction: column; align-items: flex-start; gap: 4px;"
                            >
                                <span style="font-weight:700">Gnome</span>
                                <span style="font-size:0.8rem; color:var(--dim-label)"
                                    >For Adwaita</span
                                >
                            </div>
                            <div
                                class="adw-row"
                                style="flex-direction: column; align-items: flex-start; gap: 4px;"
                            >
                                <span style="font-weight:700">Google</span>
                                <span style="font-size:0.8rem; color:var(--dim-label)"
                                    >For Gemini</span
                                >
                            </div>
                            <div
                                class="adw-row"
                                style="flex-direction: column; align-items: flex-start; gap: 4px;"
                            >
                                <span style="font-weight:700">Blade0 & Jeyphr</span>
                                <span style="font-size:0.8rem; color:var(--dim-label)"
                                    >For being cool</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="maintainer-popup" class="popover-inner common-popover">
        <div class="popup-arrow" id="mp-arrow"></div>
        <div
            id="mp-content"
            style="padding: 16px; gap: 10px; display: flex;flex-direction: column;"
        ></div>
    </div>
    <div id="toast">Copied to Clipboard</div>
{/if}
