<script>
    import { onMount } from "svelte";

    export let questions;
    export let q;
    export let i;
    export let submitted;

    let noise3D;
    let gradient = "▚▀▒░#@/*+=-:·";
    // let gradient = "█▓▒░|/:÷×+-=?*·";
    // let gradient = "▅▄▃▂▁";
    gradient = "█▉▊▋▌▍▎▏"
    gradient = "█▊▋▌▓▒░▍▎▏"
    gradient = "█▍▎▏▓▒░#@/*+=-:·"


    noise3D = function () {
        return 0;
    };

    function printPoster(question) {
        const posterContent = document.querySelector(
            `#poster-${question}`,
        ).innerHTML;
        document.body.innerHTML = posterContent;
        const buttons = document.querySelectorAll("button");
        buttons.forEach((button) => {
            button.style.display = "none";
        });

        window.print();
        location.reload();
    }

    function getCartridge(question) {
        const r = questions.find((d) => d.question == question);
        return r?.cartridge;
    }

    function getColor(question) {
        const r = questions.find((d) => d.question == question);
        return r?.color;
    }

    const characters = q.data
        .map((d) => d.answer.trim().length + 1)
        .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    const loremChar =
        Number(getCartridge(q.question)) - characters > 0
            ? Number(getCartridge(q.question)) - characters
            : 0;

    let scale = Math.random() * (0.5 - 0.1) + 0.1;
    let s = Math.random() * (0.09 - 0.03) + 0.01;

    function getNoiseCharacter(x, y, t) {
        const noiseValue = noise3D(x * s, (y * s) / 0.5, t);
        const i = Math.floor((noiseValue * scale + scale) * gradient.length);
        return gradient[Math.min(Math.max(i, 0), gradient.length - 1)];
    }

    let combinedArray = [];
    let t = 0;

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    let change = false;
    function changeLayout() {
        change = !change;
        generateCombinedArray();
    }

    function reDraw() {
        scale = Math.random() * (0.5 - 0.1) + 0.1;
        s = Math.random() * (0.09 - 0.03) + 0.01;
        generateCombinedArray();
    }

    function generateCombinedArray() {
        combinedArray = [
            ...q.data.map((d, idx) => ({
                type: "text",
                content: `${d.answer.trim()}`,
                id: `text-${idx}-${d.answer.trim()}`,
            })),
            ...Array(loremChar)
                .fill()
                .map((_, idx) => ({
                    type: "empty",
                    content: "",
                    id: `empty-${idx}`,
                })),
        ];

        if (!change) {
            shuffleArray(combinedArray);
        }

        let textIndices = new Set();

        // Mark text indices
        combinedArray.forEach((item, index) => {
            if (item.type === "text") {
                for (let i = 0; i < item.content.length; i++) {
                    textIndices.add(index + i);
                }
            }
        });

        combinedArray = combinedArray.map((item, index) => {
            if (item.type === "empty" && !textIndices.has(index)) {
                const x = index % 107;
                const y = Math.floor(index / 107);
                item.content = getNoiseCharacter(x, y, t);
            }

            return item;
        });
    }

    onMount(() => {
        fetch("simplex.js")
            .then((e) => e.text())
            .then((e) => {
                const openSimplexNoise = new Function("return " + e)();
                noise3D = openSimplexNoise(Date.now()).noise3D;
                generateCombinedArray();
            });
    });
</script>

<div id={`poster-${i}`}>
    {#if submitted}
        <button on:click={() => printPoster(i)}>Print</button>
        <button on:click={() => reDraw()}>Change Pattern</button>
        <button on:click={() => changeLayout()}
            >{change ? "Shuffle Text" : "Sort text"}</button
        >
    {/if}
    <section class="poster">
        <p>{getCartridge(q.question)} characters for a collective poster.</p>
        <p class="head">{q.question}</p>

        <div class="results" style="--theme-color: {getColor(q.question)}">
            {#each combinedArray as item (item.id)}
                {#if item.type === "text"}
                    <span class="text">{item.content}</span>
                {:else}
                    <span class="empty" style="color:{getColor(q.question)}"
                        >{item.content}</span
                    >
                {/if}
            {/each}
        </div>
        <div class="metadata">
            <p>{q.data.length} participations.</p>
            <p>{characters} characters used.</p>
            <p>{loremChar} characters left.</p>
        </div>
        <div class="metadata">
            <p>Froh!</p>
        </div>
    </section>
</div>

<style>
    .poster {
        border-radius: 3px;
        height: 1198px; /* a4 */
        width: 842px; /* a4 */
        height: 1684px; /* longer */
        flex: 0 0 842px;
        padding: 10px;
        white-space: wrap;
        border: 1px dashed;
        margin-bottom: 10px;
        font-size: 13px;
        line-height: 13px;
        font-family: "Courier New", Courier, monospace;
        word-break: break-all !important;
    }

    .results {
        margin-top: 10px;
        align-items: center;
    }

    .metadata {
        margin-top: 20px;
        padding-top: 10px;
    }

    .text {
        color: rgb(31, 31, 31);
        /* color: var(--theme-color); */
        /* opacity: 0.8; */
    }

    .text:after {
        content: "▚";
        content: "░";
        content: "*";
        color: var(--theme-color);
    }

    .empty {
        user-select: none;
        color: rgb(200, 200, 200);
    }

    button {
        position: relative;
        margin-bottom: 20px;
        cursor: pointer;
    }

    .head {
        font-weight: bold;
    }

    @media print {
        @page {
            size: A4;
            size: 8.77in 17.54in;
            margin: 0;
        }

        .poster {
            border: none;
        }
    }
</style>
