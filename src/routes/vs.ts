/**
 * TODO: Figure out how to implement this on Svelte (touching document.* stuff usually breaks, yk)
 */
export class VirtualScroller {
    private container: HTMLElement;
    private items: Element[];
    private rowHeight: number;
    private renderRowFn: (row: Element, item: Element) => any;
    private onItemClick: ((e: Event, item: Element, row: Element) => any) | undefined;

    // FIX: Ensure we find a parent even if detached (fallback to body, but better to attach first)
    private scrollParent: Element;
    private viewport: HTMLElement;

    constructor(
        container: HTMLElement,
        items: any[],
        rowHeight: number,
        renderRowFn: () => any,
        onItemClick?: () => any
    ) {
        this.container = container;
        this.items = items;
        this.rowHeight = rowHeight;
        this.renderRowFn = renderRowFn;
        this.onItemClick = onItemClick;

        // FIX: Ensure we find a parent even if detached (fallback to body, but better to attach first)
        this.scrollParent =
            this.container.closest(".main-content, .sidebar-content") || document.body;

        this.viewport = document.createElement("div");
        this.viewport.className = "virtual-viewport";
        this.viewport.style.height = `${items.length * rowHeight}px`;
        this.container.appendChild(this.viewport);

        this.renderChunk = this.renderChunk.bind(this);
        this.scrollParent.addEventListener("scroll", this.renderChunk);

        // Initial Render
        this.renderChunk();
    }

    renderChunk() {
        const scrollTop = this.scrollParent.scrollTop;

        let containerOffset = 0;
        let el: Element | null = this.container;
        while (el && el !== this.scrollParent) {
            containerOffset += (el as HTMLElement).offsetTop;
            el = (el as HTMLElement).offsetParent;
        }

        const relativeScroll = Math.max(0, scrollTop - containerOffset);
        const viewportHeight = this.scrollParent.clientHeight;

        const buffer = 10;
        let startIndex = Math.floor(relativeScroll / this.rowHeight) - buffer;
        let endIndex = Math.floor((relativeScroll + viewportHeight) / this.rowHeight) + buffer;

        startIndex = Math.max(0, startIndex);
        endIndex = Math.min(this.items.length, endIndex);

        this.viewport.innerHTML = "";

        for (let i = startIndex; i < endIndex; i++) {
            const item = this.items[i];
            const row = document.createElement("div");
            row.className = "virtual-row";
            row.style.top = `${i * this.rowHeight}px`;

            // Render content (sets row.onclick inside renderRowFn)
            this.renderRowFn(row, item);

            // FIX: Only overwrite onclick if onItemClick was actually provided in constructor
            if (this.onItemClick != undefined) {
                row.onclick = (e) => this.onItemClick!(e, item, row);
            }

            this.viewport.appendChild(row);
        }
    }

    setItems(newItems: Element[]) {
        this.items = newItems;
        this.viewport.style.height = `${this.items.length * this.rowHeight}px`;
        this.renderChunk();
    }

    // NEW: Helper to scroll to a specific index
    scrollToIndex(index: number) {
        if (index < 0 || index >= this.items.length) return;
        const itemTop = index * this.rowHeight;

        // Calculate where that is in the scrollParent
        let containerOffset = 0;
        let el = this.container;
        while (el && el !== this.scrollParent) {
            containerOffset += el.offsetTop;
            if (el.offsetParent && el.offsetParent instanceof HTMLElement) el = el.offsetParent;
        }

        // Scroll the parent
        this.scrollParent.scrollTo({
            top:
                containerOffset + itemTop - this.scrollParent.clientHeight / 2 + this.rowHeight / 2,
            behavior: "smooth"
        });
    }

    destroy() {
        if (this.scrollParent) this.scrollParent.removeEventListener("scroll", this.renderChunk);
        if (this.viewport) this.viewport.remove();
    }
}
