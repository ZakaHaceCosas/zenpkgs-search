<script lang="ts">
    import { onMount } from "svelte";

    export const ssr = false;

    let { children } = $props();

    // (until i figure out a better way of handling maintainer popovers)
    onMount(() => {
        const prevent = (e: any) => {
            if (e.touches && e.touches.length > 1) {
                e.preventDefault();
            }
        };
        window.addEventListener("touchmove", prevent, { passive: false });
        const preventWheel = (e: any) => {
            if (e.ctrlKey) e.preventDefault();
        };
        window.addEventListener("wheel", preventWheel, { passive: false });
        return () => {
            window.removeEventListener("touchmove", prevent);
            window.removeEventListener("wheel", preventWheel);
        };
    });
</script>

<svelte:head>
    <!-- <link rel="icon" href={favicon} /> -->
</svelte:head>

{@render children()}
