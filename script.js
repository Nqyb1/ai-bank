// ============================================================
// CENTRAL BANK AI
// Advanced Learning Engine
// TensorFlow.js
// ============================================================

// ============================================================
// القوائم
// ============================================================

const TRADING = [
    "USDT",
    "SOL",
    "BNB",
    "XRP",
    "ADA",
    "USDC",
    "BTC",
    "ETH",
    "TRX"
];

const INVESTMENT = [
    "Microsoft",
    "Apple",
    "Tesla",
    "Amazon",
    "Google",
    "Discord",
    "Facebook",
    "TikTok",
    "Starbucks"
];

// ============================================================
// الإعدادات
// ============================================================

const MIN_ML_DATA = 20;
const MAX_HISTORY = 500;
const MAX_MODEL_DATA = 500;
const TRAIN_EPOCHS = 35;

// ============================================================
// الحالة
// ============================================================

let currentType = null;
let currentAsset = null;
let currentPrediction = null;
let currentProbability = null;
let currentPercentages = [];
let currentResults = [];

// ============================================================
// قاعدة البيانات
// ============================================================

let database =
    JSON.parse(
        localStorage.getItem(
            "centralBankAI"
        )
    ) || {};

// ============================================================
// حفظ سريع
// ============================================================

function saveDatabase() {

    try {

        localStorage.setItem(
            "centralBankAI",
            JSON.stringify(database)
        );

    } catch (error) {

        console.error(
            "Database save error:",
            error
        );

    }

}

// ============================================================
// مفتاح الأصل
// ============================================================

function assetKey() {

    return (
        currentType +
        "::" +
        currentAsset
    );

}

// ============================================================
// بيانات الأصل
// ============================================================

function getData() {

    const key =
        assetKey();

    if (!database[key]) {

        database[key] = {

            history: [],
            modelData: []

        };

        saveDatabase();

    }

    return database[key];

}

// ============================================================
// الصفحات
// ============================================================

function hideAll() {

    document
        .querySelectorAll("section")
        .forEach(
            section =>
                section.classList.add(
                    "hidden"
                )
        );

}

function showHome() {

    hideAll();

    document
        .getElementById("home")
        .classList.remove(
            "hidden"
        );

}

function showAssets() {

    hideAll();

    document
        .getElementById("assets")
        .classList.remove(
            "hidden"
        );

}

function showInput() {

    hideAll();

    document
        .getElementById("input")
        .classList.remove(
            "hidden"
        );

}

// ============================================================
// اختيار النظام
// ============================================================

function chooseType(type) {

    currentType = type;
    currentAsset = null;

    hideAll();

    document
        .getElementById("assets")
        .classList.remove(
            "hidden"
        );

    const title =
        document.getElementById(
            "assetTitle"
        );

    if (
        type === "trading"
    ) {

        title.textContent =
            "💹 اختر أصل التداول";

        createAssets(
            TRADING
        );

    } else {

        title.textContent =
            "📈 اختر شركة الاستثمار";

        createAssets(
            INVESTMENT
        );

    }

}

// ============================================================
// إنشاء الأصول
// ============================================================

function createAssets(
    assets
) {

    const container =
        document.getElementById(
            "assetButtons"
        );

    container.innerHTML = "";

    assets.forEach(
        (asset, index) => {

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "asset";

            button.textContent =
                `${index + 1} - ${asset}`;

            button.onclick =
                () =>
                    chooseAsset(
                        asset
                    );

            container.appendChild(
                button
            );

        }
    );

}

// ============================================================
// اختيار الأصل
// ============================================================

function chooseAsset(
    asset
) {

    currentAsset = asset;

    hideAll();

    document
        .getElementById("input")
        .classList.remove(
            "hidden"
        );

    document
        .getElementById(
            "selectedAsset"
        )
        .textContent =
            currentAsset;

    clearInputs();

}

// ============================================================
// تنظيف الحقول
// ============================================================

function clearInputs() {

    currentPercentages = [];
    currentResults = [];
    currentPrediction = null;
    currentProbability = null;

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        const percentage =
            document.getElementById(
                "p" + i
            );

        if (percentage) {

            percentage.value = "";

        }

        const result =
            document.getElementById(
                "r" + i
            );

        if (result) {

            result.value = "";

        }

    }

}

// ============================================================
// قراءة البيانات
// ============================================================

function readInputData() {

    const percentages = [];
    const results = [];

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        const percentageElement =
            document.getElementById(
                "p" + i
            );

        const resultElement =
            document.getElementById(
                "r" + i
            );

        if (
            !percentageElement ||
            !resultElement
        ) {

            alert(
                `حقول النسبة/النتيجة رقم ${i} غير موجودة.`
            );

            return null;

        }

        const value =
            Number(
                percentageElement.value
            );

        if (
            !Number.isFinite(value) ||
            value < 0 ||
            value > 100
        ) {

            alert(
                `النسبة رقم ${i} يجب أن تكون بين 0 و100.`
            );

            return null;

        }

        const result =
            resultElement.value;

        if (
            result !== "ناجح" &&
            result !== "خاسر"
        ) {

            alert(
                `اختر ناجح أو خاسر للنسبة رقم ${i}.`
            );

            return null;

        }

        percentages.push(value);
        results.push(result);

    }

    return {
        percentages,
        results
    };

}

// ============================================================
// تحويل النتيجة
// ============================================================

function resultToNumber(
    result
) {

    return result === "ناجح"
        ? 1
        : 0;

}

// ============================================================
// التحليل الإحصائي
// ============================================================

function calculateStats(
    percentages,
    results
) {

    const average =
        percentages.reduce(
            (a, b) =>
                a + b,
            0
        ) / percentages.length;

    const changes = [];

    for (
        let i = 1;
        i < percentages.length;
        i++
    ) {

        changes.push(
            percentages[i] -
            percentages[i - 1]
        );

    }

    const trend =
        changes.length
            ? changes.reduce(
                (a, b) =>
                    a + b,
                0
            ) /
            changes.length
            : 0;

    const positiveChanges =
        changes.filter(
            x => x > 0
        ).length;

    const negativeChanges =
        changes.filter(
            x => x < 0
        ).length;

    const successful =
        results.filter(
            x => x === "ناجح"
        ).length;

    const failed =
        results.filter(
            x => x === "خاسر"
        ).length;

    const successRate =
        successful /
        Math.max(
            results.length,
            1
        );

    return {

        average,
        trend,
        positiveChanges,
        negativeChanges,
        successful,
        failed,
        successRate

    };

}

// ============================================================
// Features
// ============================================================

function makeFeatures(
    percentages,
    results
) {

    const stats =
        calculateStats(
            percentages,
            results
        );

    const features = [];

    percentages.forEach(
        value => {

            features.push(
                value / 100
            );

        }
    );

    results.forEach(
        result => {

            features.push(
                resultToNumber(
                    result
                )
            );

        }
    );

    features.push(
        stats.average / 100
    );

    features.push(
        Math.max(
            -1,
            Math.min(
                1,
                stats.trend / 100
            )
        )
    );

    features.push(
        stats.positiveChanges /
        4
    );

    features.push(
        stats.negativeChanges /
        4
    );

    features.push(
        stats.successRate
    );

    return features;

}

// ============================================================
// إنشاء النموذج
// ============================================================

function createModel() {

    const model =
        tf.sequential();

    model.add(
        tf.layers.dense({

            inputShape: [20],
            units: 32,
            activation: "relu"

        })
    );

    model.add(
        tf.layers.dropout({

            rate: 0.15

        })
    );

    model.add(
        tf.layers.dense({

            units: 16,
            activation: "relu"

        })
    );

    model.add(
        tf.layers.dense({

            units: 8,
            activation: "relu"

        })
    );

    model.add(
        tf.layers.dense({

            units: 1,
            activation: "sigmoid"

        })
    );

    model.compile({

        optimizer:
            tf.train.adam(
                0.003
            ),

        loss:
            "binaryCrossentropy",

        metrics:
            [
                "accuracy"
            ]

    });

    return model;

}

// ============================================================
// التحقق من البيانات
// ============================================================

function getValidModelData(
    modelData
) {

    return modelData.filter(
        item =>

            Array.isArray(
                item.percentages
            ) &&

            item.percentages.length === 5 &&

            Array.isArray(
                item.results
            ) &&

            item.results.length === 5 &&

            (
                item.result === "ناجح" ||
                item.result === "خاسر"
            )
    );

}

// ============================================================
// تدريب النموذج
// ============================================================

async function trainModel(
    model,
    modelData
) {

    const validData =
        getValidModelData(
            modelData
        );

    if (
        validData.length < MIN_ML_DATA
    ) {

        return null;

    }

    const xs =
        validData.map(
            item =>
                makeFeatures(
                    item.percentages,
                    item.results
                )
        );

    const ys =
        validData.map(
            item =>
                item.result === "ناجح"
                    ? 1
                    : 0
        );

    const xTensor =
        tf.tensor2d(
            xs
        );

    const yTensor =
        tf.tensor2d(
            ys.map(
                x => [x]
            )
        );

    const result =
        await model.fit(
            xTensor,
            yTensor,
            {

                epochs:
                    TRAIN_EPOCHS,

                batchSize:
                    Math.min(
                        16,
                        validData.length
                    ),

                shuffle:
                    true,

                verbose:
                    0

            }
        );

    xTensor.dispose();
    yTensor.dispose();

    return result;

}

// ============================================================
// تحليل الأنماط السابقة
// ============================================================

function patternPrediction(
    currentPercentages,
    currentResults,
    modelData
) {

    const validData =
        getValidModelData(
            modelData
        );

    if (
        validData.length === 0
    ) {

        return 0.5;

    }

    const currentFeatures =
        makeFeatures(
            currentPercentages,
            currentResults
        );

    const scores = [];

    validData.forEach(
        item => {

            const features =
                makeFeatures(
                    item.percentages,
                    item.results
                );

            let distance = 0;

            for (
                let i = 0;
                i < features.length;
                i++
            ) {

                distance +=
                    Math.pow(
                        currentFeatures[i] -
                        features[i],
                        2
                    );

            }

            distance =
                Math.sqrt(
                    distance
                );

            const similarity =
                1 /
                (
                    1 +
                    distance * 5
                );

            scores.push({

                similarity,

                result:
                    item.result === "ناجح"
                        ? 1
                        : 0

            });

        }
    );

    scores.sort(
        (a, b) =>
            b.similarity -
            a.similarity
    );

    const nearest =
        scores.slice(
            0,
            Math.min(
                10,
                scores.length
            )
        );

    let weightedSuccess = 0;
    let totalWeight = 0;

    nearest.forEach(
        item => {

            weightedSuccess +=
                item.result *
                item.similarity;

            totalWeight +=
                item.similarity;

        }
    );

    if (
        totalWeight === 0
    ) {

        return 0.5;

    }

    return (
        weightedSuccess /
        totalWeight
    );

}

// ============================================================
// التحليل الإحصائي
// ============================================================

function statisticalPrediction(
    percentages,
    results
) {

    const stats =
        calculateStats(
            percentages,
            results
        );

    let score = 0;

    score +=
        (
            stats.successRate -
            0.5
        ) * 0.35;

    const trendScore =
        Math.max(
            -1,
            Math.min(
                1,
                stats.trend / 20
            )
        );

    score +=
        trendScore * 0.20;

    const lastPercentage =
        percentages[4] / 100;

    score +=
        (
            lastPercentage -
            0.5
        ) * 0.20;

    const range =
        Math.max(
            ...percentages
        ) -
        Math.min(
            ...percentages
        );

    if (
        range < 10
    ) {

        score +=
            0.05;

    }

    let recentWeight = 0;
    let recentTotal = 0;

    for (
        let i = 0;
        i < results.length;
        i++
    ) {

        const weight =
            i + 1;

        recentWeight +=
            resultToNumber(
                results[i]
            ) *
            weight;

        recentTotal +=
            weight;

    }

    const recentRate =
        recentWeight /
        recentTotal;

    score +=
        (
            recentRate -
            0.5
        ) * 0.20;

    return Math.max(
        0,
        Math.min(
            1,
            0.5 + score
        )
    );

}

// ============================================================
// التوقع الكامل
// ============================================================

async function generatePrediction(
    percentages,
    results,
    data
) {

    const validData =
        getValidModelData(
            data.modelData
        );

    const statistical =
        statisticalPrediction(
            percentages,
            results
        );

    const pattern =
        patternPrediction(
            percentages,
            results,
            validData
        );

    let mlProbability =
        0.5;

    if (
        validData.length >= MIN_ML_DATA
    ) {

        const model =
            createModel();

        try {

            await trainModel(
                model,
                validData
            );

            const features =
                makeFeatures(
                    percentages,
                    results
                );

            const input =
                tf.tensor2d([
                    features
                ]);

            const output =
                model.predict(
                    input
                );

            mlProbability =
                (
                    await output.data()
                )[0];

            input.dispose();
            output.dispose();

        } catch (error) {

            console.error(
                "ML prediction error:",
                error
            );

        }

        model.dispose();

    }

    let probability;

    if (
        validData.length >= MIN_ML_DATA
    ) {

        probability =
            (
                mlProbability * 0.45
            ) +
            (
                pattern * 0.35
            ) +
            (
                statistical * 0.20
            );

    } else {

        probability =
            (
                pattern * 0.55
            ) +
            (
                statistical * 0.45
            );

    }

    const dataFactor =
        Math.min(
            validData.length / 60,
            1
        );

    const distanceFromMiddle =
        Math.abs(
            probability -
            0.5
        );

    const confidence =
        50 +
        (
            distanceFromMiddle *
            100 *
            (
                0.45 +
                dataFactor * 0.55
            )
        );

    return {

        probability,
        confidence,
        mlProbability,

        patternProbability:
            pattern,

        statisticalProbability:
            statistical,

        dataCount:
            validData.length

    };

}

// ============================================================
// التوقع
// ============================================================

async function predict() {

    const inputData =
        readInputData();

    if (
        !inputData
    ) {

        return;

    }

    currentPercentages =
        [
            ...inputData.percentages
        ];

    currentResults =
        [
            ...inputData.results
        ];

    const data =
        getData();

    hideAll();

    document
        .getElementById("result")
        .classList.remove(
            "hidden"
        );

    document
        .getElementById(
            "prediction"
        )
        .textContent =
            "جاري التحليل المتقدم...";

    document
        .getElementById(
            "confidence"
        )
        .textContent =
            "";

    document
        .getElementById(
            "modelInfo"
        )
        .textContent =
            "";

    const result =
        await generatePrediction(
            inputData.percentages,
            inputData.results,
            data
        );

    currentProbability =
        result.probability;

    currentPrediction =
        result.probability >= 0.5
            ? "ناجح"
            : "خاسر";

    const confidence =
        result.confidence.toFixed(
            1
        );

    document
        .getElementById(
            "prediction"
        )
        .textContent =
            `التوقع: ${currentPrediction}`;

    document
        .getElementById(
            "prediction"
        )
        .className =
            currentPrediction === "ناجح"
                ? "win"
                : "loss";

    document
        .getElementById(
            "confidence"
        )
        .textContent =
            `ثقة التحليل: ${confidence}%`;

    document
        .getElementById(
            "modelInfo"
        )
        .textContent =
            result.dataCount >= MIN_ML_DATA

                ? `تحليل ${result.dataCount} نتيجة سابقة + تعلم آلي + تحليل الأنماط`

                : `البيانات التدريبية: ${result.dataCount} / ${MIN_ML_DATA} — التعلم الآلي الكامل لم يبدأ بعد.`;

}

// ============================================================
// تسجيل النتيجة
// ============================================================

function recordResult(
    actual
) {

    if (
        !currentAsset ||
        currentPercentages.length !== 5 ||
        currentResults.length !== 5 ||
        !currentPrediction
    ) {

        alert(
            "لا توجد عملية توقع صالحة للحفظ."
        );

        return;

    }

    if (
        actual !== "ناجح" &&
        actual !== "خاسر"
    ) {

        return;

    }

    const data =
        getData();

    const now =
        new Date().toISOString();

    data.history.push({

        percentages:
            [
                ...currentPercentages
            ],

        results:
            [
                ...currentResults
            ],

        prediction:
            currentPrediction,

        probability:
            currentProbability,

        actual:
            actual,

        time:
            now

    });

    data.modelData.push({

        percentages:
            [
                ...currentPercentages
            ],

        results:
            [
                ...currentResults
            ],

        result:
            actual,

        time:
            now

    });

    if (
        data.history.length >
        MAX_HISTORY
    ) {

        data.history =
            data.history.slice(
                -MAX_HISTORY
            );

    }

    if (
        data.modelData.length >
        MAX_MODEL_DATA
    ) {

        data.modelData =
            data.modelData.slice(
                -MAX_MODEL_DATA
            );

    }

    saveDatabase();

    alert(
        "تم حفظ النتيجة فورًا وإضافتها إلى بيانات التعلم."
    );

    showInput();

}

// ============================================================
// تعديل نتيجة محفوظة
// ============================================================

function editHistoryItem(
    historyIndex
) {

    const data =
        getData();

    if (
        !data.history ||
        !data.history[historyIndex]
    ) {

        alert(
            "النتيجة غير موجودة."
        );

        return;

    }

    const item =
        data.history[
            historyIndex
        ];

    const newActual =
        prompt(
            "اكتب النتيجة الصحيحة:\n\nناجح\nخاسر",
            item.actual
        );

    if (
        newActual !== "ناجح" &&
        newActual !== "خاسر"
    ) {

        alert(
            "يجب كتابة ناجح أو خاسر."
        );

        return;

    }

    item.actual =
        newActual;

    if (
        data.modelData &&
        data.modelData[historyIndex]
    ) {

        data.modelData[
            historyIndex
        ].result =
            newActual;

    }

    saveDatabase();

    alert(
        "تم تعديل النتيجة وحفظها وتحديث بيانات التعلم بنجاح."
    );

    showHistory();

}

// ============================================================
// حذف توقع محفوظ
// ============================================================

function deleteHistoryItem(
    historyIndex
) {

    const data =
        getData();

    if (
        !data.history ||
        !data.history[historyIndex]
    ) {

        alert(
            "التوقع غير موجود."
        );

        return;

    }

    const confirmed =
        confirm(
            "⚠️ هل أنت متأكد من حذف هذا التوقع؟\n\nسيتم حذفه أيضًا من بيانات التعلم."
        );

    if (!confirmed) {

        return;

    }

    data.history.splice(
        historyIndex,
        1
    );

    if (
        data.modelData &&
        data.modelData[historyIndex]
    ) {

        data.modelData.splice(
            historyIndex,
            1
        );

    }

    saveDatabase();

    alert(
        "تم حذف التوقع وتحديث بيانات التعلم."
    );

    showHistory();

}

// ============================================================
// دقة التوقعات
// ============================================================

function calculateAccuracy(
    history
) {

    if (
        !history ||
        history.length === 0
    ) {

        return 0;

    }

    let correct = 0;

    history.forEach(
        item => {

            if (
                item.prediction ===
                item.actual
            ) {

                correct++;

            }

        }
    );

    return (
        correct /
        history.length
    ) * 100;

}

// ============================================================
// عرض السجل
// ============================================================

function showHistory() {

    const data =
        getData();

    hideAll();

    document
        .getElementById(
            "history"
        )
        .classList.remove(
            "hidden"
        );

    document
        .getElementById(
            "historyAsset"
        )
        .textContent =
            currentAsset;

    const list =
        document.getElementById(
            "historyList"
        );

    list.innerHTML = "";

    if (
        data.history.length === 0
    ) {

        list.innerHTML =
            "<p>لا توجد نتائج لهذا الأصل.</p>";

        return;

    }

    const validData =
        getValidModelData(
            data.modelData
        );

    const accuracy =
        calculateAccuracy(
            data.history
        );

    const correct =
        data.history.filter(
            item =>
                item.prediction ===
                item.actual
        ).length;

    const summary =
        document.createElement(
            "div"
        );

    summary.className =
        "history-item";

    summary.innerHTML = `

        <strong>
            إحصائيات ${currentAsset}
        </strong>

        <br><br>

        عدد التوقعات:
        ${data.history.length}

        <br>

        الصحيحة:
        ${correct}

        <br>

        الخاطئة:
        ${data.history.length - correct}

        <br>

        دقة التوقعات السابقة:
        ${accuracy.toFixed(2)}%

        <br>

        بيانات التعلم:
        ${validData.length}

    `;

    list.appendChild(
        summary
    );

    data.history
        .slice()
        .reverse()
        .forEach(
            (item, index) => {

                const originalIndex =
                    data.history.length -
                    1 -
                    index;

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "history-item";

                const percentagesText =
                    item.percentages
                        .map(
                            (
                                percentage,
                                i
                            ) => {

                                const result =
                                    item.results &&
                                    item.results[i]
                                        ? item.results[i]
                                        : "غير معروف";

                                return `${percentage}% (${result})`;

                            }
                        )
                        .join(
                            " → "
                        );

                const isCorrect =
                    item.prediction ===
                    item.actual;

                const probabilityText =
                    typeof item.probability ===
                    "number"

                        ? `${(
                            item.probability *
                            100
                        ).toFixed(1)}%`

                        : "غير متوفر";

                div.innerHTML = `

                    <strong>
                        نتيجة ${data.history.length - index}
                    </strong>

                    <br><br>

                    النسب والحالات:
                    ${percentagesText}

                    <br>

                    التوقع:
                    ${item.prediction}

                    <br>

                    احتمال النجاح:
                    ${probabilityText}

                    <br>

                    النتيجة الحقيقية:
                    ${item.actual}

                    <br>

                    حالة التوقع:
                    ${
                        isCorrect
                            ? "✅ صحيح"
                            : "❌ خطأ"
                    }

                    <br><br>

                    <button
                        onclick="editHistoryItem(${originalIndex})"
                    >
                        ✏️ تعديل النتيجة
                    </button>

                    <button
                        onclick="deleteHistoryItem(${originalIndex})"
                    >
                        🗑️ حذف التوقع
                    </button>

                `;

                list.appendChild(
                    div
                );

            }
        );

}

// ============================================================
// البداية
// ============================================================

showHome();
