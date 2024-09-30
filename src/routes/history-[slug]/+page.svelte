<script>
    import { onMount } from "svelte";
    import HistoryPoster from "@components/HistoryPoster.svelte";

    let questions = [];
    let answers = [];
    let datum = [];
    let question = "";
    let history = [];
    let q = null;
    let currentIndex = 0;

    export let data;

    async function fetchData() {
        const res = await fetch(`/api/getAll`);
        const json = await res.json();
        return json.reverse();
    }

    async function fetchQuestions() {
        const res = await fetch(`/api/question`);
        const json = await res.json();
        return json.reverse();
    }

    async function loadData() {
        questions = await fetchQuestions();
        answers = await fetchData();

        question = questions.find(
            (d) => d._id == data.slug.replace("history-", ""),
        );

        datum = answers
            .filter((d) => d.question == question.question)
            .reduce((acc, entry) => {
                const { question, answer } = entry;
                const lastCluster = acc[acc.length - 1];

                if (!lastCluster || lastCluster.question !== question) {
                    acc.push({ question, data: [{ answer }] });
                } else {
                    lastCluster.data.push({ answer });
                }

                return acc;
            }, []);

        history = [
            {
                question: datum[0]?.question || "",
                ascii: question.ascii,
                data: datum[0]?.data.reverse() || [],
            },
        ];

        q = null;
        setTimeout(() => {
            q = history[0];
        }, 0);
    }

    onMount(async () => {
        await loadData();

        setInterval(async () => {
            await loadData();
        }, 2000);
    });
</script>

<article>
    {#if question && q}
        <article class="container">
            <HistoryPoster {q} i={currentIndex} {questions} />
        </article>
        <div class="print">Use the laptop to print ←</div>
    {:else}
        <p>Loading...</p>
    {/if}
</article>

<style>
    article {
        background-color: white;
        background-color: rgb(254, 255, 231);
        min-height: 100vh;
    }

    .container {
        display: flex;
        flex-wrap: nowrap;
        overflow: auto;
        gap: 10px;
    }

    .print {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, 50%);
        font-size: 40px;
        color: blue;
    }

    p {
        font-size: 12px;
    }
</style>
