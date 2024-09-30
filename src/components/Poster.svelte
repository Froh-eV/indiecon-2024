<script>
    import { onMount } from "svelte";
    let charleng = 116; // 105
    export let questions;
    export let q;
    export let i;
    export let submitted;
    export let staticPoster;
    export let back;

    let noiseCharArray = [];

    try {
        const ascii = getAscii(q.question);
        if (ascii) {
            noiseCharArray = JSON.parse(ascii);
        } else {
            noiseCharArray = [];
        }
    } catch (error) {
        noiseCharArray = [];
    }

    let noise3D;
    let gradient = "▚▀▒░#@/*+=-:·";
    // gradient = "█▉▊▋▌▍▎▏";
    // gradient = "█▊▋▌▓▒░▍▎▏";
    // gradient = "█▍▎▏▚▀▓▒░#@/*+=-:·";
    // gradient = "█▇▆▅▄▃▂▁▓▉▊▋▌▍▎▏▒░■□▪▫#@&%$O0o+=~-^:,._`'·";
    gradient = "█▍▎▏▚▀▓▉▊▋▌▍▎▏■□▪▫#@&%$O0o+=~-^:,._`'·";
    // gradient = "█▍▎▏▚▀▓▒░#@■□▪▫/*+=-:·";
    const fixedChars = new Set(["░", "▓"]);

    let gradientOpacities = {};
    const minOpacity = 0.0;
    const maxOpacity = 1.0;
    const gradientLength = gradient.length;

    gradient.split("").forEach((char, index) => {
        gradientOpacities[char] =
            maxOpacity -
            (index * (maxOpacity - minOpacity)) / (gradientLength - 1);
    });

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
        location.assign("/");
    }

    function getAscii(question) {
        const r = questions.find((d) => d.question == question);
        return r?.ascii;
    }

    function getCartridge(question) {
        const r = questions.find((d) => d.question == question);
        return r?.cartridge;
    }

    function getColor(question) {
        const r = questions.find((d) => d.question == question);
        return r?.color;
    }

    let fixedCharCount = 0;

    if (noiseCharArray.length > 0) {
        fixedCharCount = noiseCharArray.filter((char) =>
            fixedChars.has(char),
        ).length;
    }

    $: characters = q.data
        .map((d) => d.answer.trim().length)
        .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    $: loremChar =
        Number(getCartridge(q.question)) - characters - fixedCharCount > 0
            ? Number(getCartridge(q.question)) - characters - fixedCharCount
            : 0;

    let scale =
        loremChar > getCartridge(q.question) / 2
            ? Math.random() * (0.9 - 0.1) + 0.2
            : Math.random() * (0.5 - 0.1) + 0.2;
    let s =
        loremChar > getCartridge(q.question) / 2
            ? Math.random() * (0.09 - 0.01) + 0.05
            : Math.random() * (0.09 - 0.03) + 0.01;

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
        scale =
            loremChar > getCartridge(q.question) / 2
                ? Math.random() * (0.9 - 0.1) + 0.2
                : Math.random() * (0.5 - 0.1) + 0.2;
        s =
            loremChar > getCartridge(q.question) / 2
                ? Math.random() * (0.09 - 0.01) + 0.05
                : Math.random() * (0.09 - 0.03) + 0.01;
        generateCombinedArray();
    }

    function generateCombinedArray() {
        combinedArray = [
            ...q.data.map((d, idx) => ({
                type: "text",
                content: `${d.answer.trim()}`,
                id: `text-${idx}-${d.answer.trim()}`,
            })),
            ...Array(loremChar + fixedCharCount)
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

        let cumulativeLength = 0;
        let noiseIndex = 0;
        let logArray = [];

        combinedArray = combinedArray.flatMap((item, index) => {
            if (item.type === "text") {
                const result = [];
                let textIndex = 0; // Reset textIndex for each new text item

                while (textIndex < item.content.length) {
                    const x = cumulativeLength % charleng;
                    const y = Math.floor(cumulativeLength / charleng);

                    const noiseChar =
                        noiseCharArray.length > 0
                            ? noiseCharArray[noiseIndex++]
                            : getNoiseCharacter(x, y, t);

                    if (!fixedChars.has(noiseChar)) {
                        result.push({
                            type: "char",
                            content: item.content[textIndex],
                            noiseChar: noiseChar,
                            opacity: gradientOpacities[noiseChar],
                            id: `char-${index}-${textIndex}-${item.id}`,
                        });
                        textIndex++;
                    } else {
                        result.push({
                            type: "empty",
                            content: noiseChar,
                            fixed: true,
                            opacity: gradientOpacities[noiseChar],
                            id: `fixed-${index}-${cumulativeLength}-${x}-${y}`,
                        });
                    }
                    logArray.push(noiseChar);
                    cumulativeLength++;
                }
                return result;
            } else {
                const x = cumulativeLength % charleng;
                const y = Math.floor(cumulativeLength / charleng);
                const noiseChar =
                    noiseCharArray.length > 0
                        ? noiseCharArray[noiseIndex++]
                        : getNoiseCharacter(x, y, t);

                const uniqueId = `empty-${index}-${cumulativeLength}-${x}-${y}`;
                item.content = noiseChar;
                item.fixed = fixedChars.has(noiseChar);
                item.opacity = gradientOpacities[noiseChar];
                item.id = uniqueId;

                logArray.push(noiseChar);
                cumulativeLength++;
                return [item];
            }
        });

        // console.log(logArray);

        combinedArray.forEach((item, index) => {
            if (!item.id) {
                item.id = `item-${index}`;
            }
        });
    }

    onMount(() => {
        if (noiseCharArray.length === 0) {
            fetch("simplex.js")
                .then((e) => e.text())
                .then((e) => {
                    const openSimplexNoise = new Function("return " + e)();
                    noise3D = openSimplexNoise(Date.now()).noise3D;
                    generateCombinedArray();
                });
        } else {
            generateCombinedArray(); // If noiseCharArray is provided, just generate the combined array
        }
    });

    $: {
        if (!staticPoster && i) {
            reDraw();
        }
    }

    function mapValue(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }

    const now = new Date();

    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");

    const month = now.toLocaleString("en-US", { month: "short" });
    const day = now.getDate().toString().padStart(2, "0");
    const year = now.getFullYear();

    const formattedDate = `${hours}:${minutes}:${seconds}, ${month} ${day} ${year}`;

    function getNumberWithOrdinal(n) {
        var s = ["th", "st", "nd", "rd"],
            v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
</script>

<div id={`poster-${i}`}>
    {#if submitted}
        <button on:click={() => printPoster(i)}>Print</button>
        <button>
            <a href="/">Restart</a>
        </button>
    {/if}
    <section class="poster">
        <div class="meta">
            <!-- <p>
                {getCartridge(q.question)} total characters
            </p>
             -->
            <!-- <p>{characters} characters used in total</p> -->
            <div>
                <p>You used {q.data[0]?.answer.length} characters,</p>
                <p>
                    and are the {getNumberWithOrdinal(q.data.length)} contribution.
                </p>
            </div>
            <p>
                {formattedDate}
            </p>
        </div>
        <p class="head mt">{q.question}</p>

        <div class="results" style="--theme-color: {getColor(q.question)}">
            {#each combinedArray as item (item.id)}
                {#if item.content}
                    {#if item.type === "char"}
                        <span class="word" style="display:inline-block;">
                            <span style="opacity: {item.opacity};" class="text"
                                >{item.content}</span
                            >
                        </span>
                    {:else}
                        <span
                            class="empty {item.fixed ? 'fixed' : ''}"
                            style="color: {item.fixed
                                ? getColor(q.question)
                                : ''};">{item.content}</span
                        >
                    {/if}
                {/if}
            {/each}
        </div>

        <!-- <div class="meta mt">
            <p>A project by Froh!</p>
        </div> -->
    </section>
    {#if back == true}
        <section class="poster back">
            <div class="meta">
                <!-- <p>
                    {getCartridge(q.question)} total characters
                </p>
                 -->
                <!-- <p>{characters} characters used in total</p> -->
                <div>
                    <p>You used {q.data[0]?.answer.length} characters</p>

                    <p>Contribution number: {q.data.length}</p>
                </div>
                <p>
                    {formattedDate}
                </p>
            </div>
            <p class="head mt">{q.question}</p>

            <div class="results" style="--theme-color: {getColor(q.question)}">
                {#each combinedArray as item (item.id)}
                    {#if item.content}
                        {#if item.type === "char"}
                            <span class="word" style="display:inline-block;">
                                <span
                                    style="opacity: {item.opacity};"
                                    class="text">{item.content}</span
                                >
                            </span>
                        {:else}
                            <span
                                class="empty {item.fixed ? 'fixed' : ''}"
                                style="color: {item.fixed
                                    ? getColor(q.question)
                                    : ''};">{item.content}</span
                            >
                        {/if}
                    {/if}
                {/each}
            </div>
        </section>
    {/if}
</div>

<style>
    .poster {
        border-radius: 3px;
        /* height: 1511px; */
        width: 842px; /* a4 */
        /* size: 20cm 35cm; */
        flex: 0 0 842px;
        padding: 20px;
        white-space: wrap;
        border: 1px dashed;
        margin-bottom: 10px;
        font-size: 12px;
        line-height: 12px;
        font-family: "Recursive", monospace;
        word-break: break-all !important;
        user-select: none;

        /* opacity: 0.3; */
    }

    .results {
        margin-top: 10px;
        align-items: center;
    }

    .head {
        font-family: Helvetica, sans-serif;
        font-size: 32px;
        line-height: 36px;
        max-width: 700px;
        break-inside: avoid;
        margin-bottom: 10px;
        display: block;
        word-break: break-word !important;
        height: 100px;
        /* background: red; */
    }

    .meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        padding-bottom: 10px;

        /* flex-direction: row-reverse; */
    }

    .mt {
        margin-top: 20px;
        padding-top: 10px;
    }

    .text {
        color: #252525;
        color: var(--theme-color);
        color: black;
    }

    .fixed {
        /* visibility: hidden; */
    }

    .back .meta,
    .back .head,
    .back span:not(.fixed) {
        visibility: hidden;
    }

    .empty {
        color: rgb(239, 239, 239);
    }

    .word {
        min-width: 1ch;
    }

    @media print {
        @page {
            size: A4;
            /* size: 8.66142in 13.7795in; */
            size: 20cm 35cm;
            margin: 0;
        }

        .poster {
            border: none;
            page-break-after: always;
        }

        .fixed {
            visibility: hidden;
        }

        .back .fixed {
            visibility: visible !important;
        }
    }
    button {
        position: relative;
        margin-bottom: 20px;
        cursor: pointer;
        border: none;
        background-color: rgb(248, 248, 248);
        color: black;
        margin-top: 5px;
        padding: 5px 10px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        /* width: 100%;
        min-height: 80px; */
        font-size: 40px;
        border-radius: 5px;
        /* border: 1px solid blue; */
    }

    button a {
        text-decoration: none;
    }

    button:not(:disabled):hover {
        background-color: blue;
        color: white;
    }

    *:disabled {
        color: rgb(105, 105, 105);
        cursor: not-allowed;
    }

    /* @font-face {
        font-family: "sono";
        src: url("fonts/sono.ttf") format("truetype");
        font-weight: normal;
        font-style: normal;
    } */
</style>
