#!/usr/bin/env python3
"""Author source-by-topic/evaluation-and-general.json: confusion-matrix
calculation questions (generated programmatically so the arithmetic is
guaranteed correct) plus hand-written graph-reading, metric-selection, and
general-ML-knowledge questions, all in the real-exam style (see the two
past papers in ../../papers/).
"""
import json
import random
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "source-by-topic" / "evaluation-and-general.json"

random.seed(20261029)

METRIC_FNS = {
    "accuracy": lambda tp, fp, fn, tn: (tp + tn) / (tp + fp + fn + tn),
    "precision": lambda tp, fp, fn, tn: tp / (tp + fp),
    "recall": lambda tp, fp, fn, tn: tp / (tp + fn),
    "specificity": lambda tp, fp, fn, tn: tn / (tn + fp),
    "f1": lambda tp, fp, fn, tn: (2 * tp) / (2 * tp + fp + fn),
}
METRIC_LABEL = {
    "accuracy": "accuracy",
    "precision": "precision",
    "recall": "recall (sensitivity)",
    "specificity": "specificity",
    "f1": "F1-score",
}

SCENARIOS = [
    ("a disease-screening model", "patients", "Disease present", "Disease absent"),
    ("a fraud-detection model", "transactions", "Fraudulent", "Legitimate"),
    ("a spam filter", "emails", "Spam", "Not spam"),
    ("a loan-default model", "applicants", "Will default", "Will repay"),
    ("a churn-prediction model", "customers", "Will churn", "Will stay"),
    ("a manufacturing defect detector", "parts", "Defective", "Good"),
    ("a credit-card fraud model", "transactions", "Fraud", "Genuine"),
    ("a student-dropout predictor", "students", "Will drop out", "Will continue"),
]


def fmt(x):
    return f"{x:.2f}"


def make_confusion_question(n, metric):
    tp = random.randint(15, 95)
    fp = random.randint(5, 60)
    fn = random.randint(5, 60)
    tn = random.randint(20, 300)
    name, unit, pos_label, neg_label = random.choice(SCENARIOS)

    correct_val = METRIC_FNS[metric](tp, fp, fn, tn)

    # plausible wrong answers: common formula-confusion mistakes
    wrong_candidates = {
        "used_precision_formula": tp / (tp + fp) if (tp + fp) else 0,
        "used_recall_formula": tp / (tp + fn) if (tp + fn) else 0,
        "used_accuracy_formula": (tp + tn) / (tp + fp + fn + tn),
        "used_specificity_formula": tn / (tn + fp) if (tn + fp) else 0,
        "wrong_denominator_all": tp / (tp + fp + fn + tn),
        "swapped_tp_tn": tn / (tn + fn) if (tn + fn) else 0,
    }
    # never offer the correct formula itself as a "wrong" option
    correct_formula_key = {
        "accuracy": "used_accuracy_formula",
        "precision": "used_precision_formula",
        "recall": "used_recall_formula",
        "specificity": "used_specificity_formula",
    }.get(metric)

    pool = [v for k, v in wrong_candidates.items() if k != correct_formula_key]
    random.shuffle(pool)
    wrongs = []
    seen = {round(correct_val, 2)}
    for v in pool:
        rv = round(v, 2)
        if rv not in seen:
            wrongs.append(rv)
            seen.add(rv)
        if len(wrongs) == 3:
            break
    # pad with small offset distractors if formula collisions left us short
    offset = 0.05
    while len(wrongs) < 3:
        cand = round(max(0.0, min(1.0, correct_val + offset)), 2)
        if cand not in seen:
            wrongs.append(cand)
            seen.add(cand)
        offset = -offset - 0.05 if offset > 0 else -offset + 0.05

    table = {
        "headers": ["", f"Predicted {pos_label}", f"Predicted {neg_label}"],
        "rows": [
            [f"Actual {pos_label}", tp, fn],
            [f"Actual {neg_label}", fp, tn],
        ],
    }

    total = tp + fp + fn + tn
    q = (
        f"You deploy {name} and evaluate it on a held-out set of {total} {unit}. "
        f"The confusion matrix is shown below. What is the {METRIC_LABEL[metric]}?"
    )

    options = [fmt(correct_val)] + [fmt(w) for w in wrongs]

    return {
        "id": f"evalgen-cm-{n:03d}",
        "topic": "evaluation-and-general",
        "subtopic": "Confusion-matrix calculations",
        "difficulty": "application",
        "q": q,
        "table": table,
        "options": options,
        "correct": 0,
        "explanation": (
            f"{METRIC_LABEL[metric].capitalize()} = "
            + {
                "accuracy": "(TP+TN)/(TP+FP+FN+TN)",
                "precision": "TP/(TP+FP)",
                "recall": "TP/(TP+FN)",
                "specificity": "TN/(TN+FP)",
                "f1": "2*TP/(2*TP+FP+FN), the harmonic mean of precision and recall",
            }[metric]
            + f" = {fmt(correct_val)} for this matrix (TP={tp}, FP={fp}, FN={fn}, TN={tn})."
        ),
    }


def gen_confusion_questions(count):
    out = []
    metrics = list(METRIC_FNS.keys())
    for i in range(1, count + 1):
        metric = metrics[(i - 1) % len(metrics)]
        out.append(make_confusion_question(i, metric))
    return out


# ---------------------------------------------------------------------------
# Hand-written: graph-reading, metric-selection, cross-validation/splits,
# and general-ML-knowledge grab-bag questions, calibrated to the real past
# papers (ROC/PR-curve reading, feature-importance bar charts, bias-variance
# curves, imbalanced-metric judgement, model-comparison-for-deployment).
# ---------------------------------------------------------------------------

HAND_WRITTEN = [
    # --- ROC / PR curve reading ---
    {
        "id": "evalgen-chart-001", "topic": "evaluation-and-general",
        "subtopic": "ROC curve reading", "difficulty": "application",
        "q": "A fraud-detection model's ROC curve lies almost exactly on the diagonal line from (0,0) to (1,1), with AUC close to 0.50. What does this indicate about the model?",
        "chart": {"type": "roc", "shape": "random", "caption": "Figure: ROC curve"},
        "options": [
            "It is barely better than random guessing at ranking positives above negatives",
            "It is an excellent classifier with near-perfect separation between classes across most thresholds",
            "It is badly overfitting the training data and memorizing noise patterns",
            "Its predicted probabilities are perfectly calibrated to true outcome rates",
        ],
        "correct": 0,
        "explanation": "An AUC near 0.5 means the ROC curve tracks the diagonal, which is exactly what a random classifier produces — the model has essentially no discriminative ability between the two classes."
    },
    {
        "id": "evalgen-chart-002", "topic": "evaluation-and-general",
        "subtopic": "ROC curve reading", "difficulty": "analysis",
        "q": "Two fraud models are compared on the same test set. Model A's ROC curve sits consistently above and to the left of Model B's curve across the whole range of thresholds. Which model should be selected for deployment, and why?",
        "chart": {"type": "roc", "shape": "good", "caption": "Figure: ROC curve comparison, Model A vs Model B"},
        "options": [
            "Model A, since it gives a higher true-positive rate at every false-positive rate",
            "Model B, since a curve closer to the diagonal is always the safer choice for production deployment",
            "Either model, since ROC curves can't be used to compare two classifiers",
            "Model A, since a dominant curve always means more training data was used",
        ],
        "correct": 0,
        "explanation": "A ROC curve dominating another (closer to the top-left corner) means it achieves a better true-positive/false-positive trade-off at every operating threshold, so it's the stronger classifier regardless of which threshold is eventually chosen."
    },
    {
        "id": "evalgen-chart-003", "topic": "evaluation-and-general",
        "subtopic": "Precision-Recall curve reading", "difficulty": "analysis",
        "q": "A model trained on a severely imbalanced dataset (rare positive class) shows a Precision-Recall curve that drops sharply from high precision to low precision as recall increases past a moderate value. Which deployment scenario is this model riskiest for?",
        "chart": {"type": "pr", "shape": "steep_drop", "caption": "Figure: Precision-Recall curve (imbalanced classification)"},
        "options": [
            "A disease-screening system, where missing real positive cases is very costly",
            "A movie-recommendation system, where a wrong suggestion carries no real safety or financial cost",
            "An A/B test analysis that involves no classification decision at all",
            "A product-rating prediction task with a continuous numeric target",
        ],
        "correct": 0,
        "explanation": "A steep precision drop as recall increases means pushing for higher recall quickly tanks precision (many false positives) — in a safety-critical screening context, this forces an uncomfortable trade-off between missing real cases and raising too many false alarms, making the model risky when recall matters most."
    },
    # --- Feature importance bar chart reading ---
    {
        "id": "evalgen-chart-004", "topic": "evaluation-and-general",
        "subtopic": "Feature-importance chart reading", "difficulty": "analysis",
        "q": "A loan-default model's feature-importance chart shows one feature, \"Previous Default Flag\", with an importance score far higher than every other feature combined. What should this prompt the data science team to investigate first?",
        "chart": {"type": "bar", "labels": ["Age", "Income", "Loan Amount", "Previous Default Flag", "Credit Score"], "values": [0.04, 0.03, 0.05, 0.68, 0.20], "caption": "Figure: Feature importance"},
        "options": [
            "Whether that feature is a proxy for the label, i.e. target leakage",
            "Whether the model needs a larger learning rate to converge faster during retraining",
            "Whether more raw data rows need to be collected and labelled",
            "Whether the kernel function should be switched to polynomial",
        ],
        "correct": 0,
        "explanation": "One feature overwhelmingly dominating importance is a classic symptom of data leakage — the feature may encode or closely correlate with the target itself, which would make the model unreliable once that shortcut isn't available at serving time."
    },
    {
        "id": "evalgen-chart-005", "topic": "evaluation-and-general",
        "subtopic": "Feature-importance chart reading", "difficulty": "application",
        "q": "A churn-prediction model's feature-importance chart shows five features with reasonably balanced, moderate importance scores and no single feature dominating. What does this suggest about the model's behaviour?",
        "chart": {"type": "bar", "labels": ["Tenure", "Monthly Bill", "Complaints", "Usage", "Contract Type"], "values": [0.24, 0.19, 0.22, 0.17, 0.18], "caption": "Figure: Feature importance"},
        "options": [
            "It is drawing on a healthy spread of signals, not one dominant feature",
            "It has definitely failed to learn anything useful from the data",
            "The underlying dataset must contain many duplicate rows",
            "It needs to be retrained immediately with fewer input features before further testing",
        ],
        "correct": 0,
        "explanation": "A balanced importance spread across several genuinely predictive features is generally a healthy sign — it suggests the model is combining multiple real signals rather than depending on one feature that might be a leakage shortcut."
    },
    # --- Bias-variance / learning curve reading ---
    {
        "id": "evalgen-chart-006", "topic": "evaluation-and-general",
        "subtopic": "Bias-variance curve reading", "difficulty": "application",
        "q": "A model's training error stays low across all tested complexity levels, while its validation error is high at low complexity, decreases, reaches a minimum, and then rises again sharply as complexity keeps increasing. What does the rising validation error at high complexity indicate?",
        "chart": {"type": "bias_variance", "shape": "overfit", "caption": "Figure: Error vs model complexity"},
        "options": [
            "Overfitting — the model is fitting noise specific to the training set",
            "Underfitting at every complexity level shown on the chart",
            "Perfect generalization achieved at the highest complexity level tested so far",
            "A data-leakage problem rather than a bias-variance issue",
        ],
        "correct": 0,
        "explanation": "A widening gap between low training error and rising validation error as complexity increases is the textbook signature of overfitting — the model is memorizing training-set-specific noise instead of generalizable patterns."
    },
    {
        "id": "evalgen-chart-007", "topic": "evaluation-and-general",
        "subtopic": "Bias-variance curve reading", "difficulty": "application",
        "q": "Both training error and validation error are high and close to each other across all tested model complexities, with neither improving much as complexity increases. What does this pattern most likely indicate?",
        "chart": {"type": "bias_variance", "shape": "underfit", "caption": "Figure: Error vs model complexity"},
        "options": [
            "Underfitting — the model is too simple (high bias) for the pattern",
            "Overfitting, since training error is never exactly zero",
            "High variance between the cross-validation folds used",
            "A labelling error affecting only the validation set, not the training set",
        ],
        "correct": 0,
        "explanation": "High error on both training and validation data, with little improvement, is the signature of underfitting / high bias — the model lacks the capacity or features to capture the underlying relationship, so adding more data won't help; adding complexity or features will."
    },
    # --- Metric selection for scenario ---
    {
        "id": "evalgen-metric-001", "topic": "evaluation-and-general",
        "subtopic": "Choosing the right metric", "difficulty": "application",
        "q": "A cancer-screening classifier will be used to decide who gets referred for further testing. Missing an actual cancer case is far more costly than an unnecessary referral. Which metric should be prioritized when tuning the decision threshold?",
        "options": [
            "Recall for the positive (cancer-present) class",
            "Overall accuracy across both classes",
            "Precision for the negative (healthy) class",
            "Specificity alone, while ignoring recall entirely",
        ],
        "correct": 0,
        "explanation": "When false negatives (missed real cases) are far costlier than false positives, the threshold should be tuned to maximize recall for the positive class, even at some cost to precision."
    },
    {
        "id": "evalgen-metric-002", "topic": "evaluation-and-general",
        "subtopic": "Choosing the right metric", "difficulty": "application",
        "q": "An email provider wants to minimize the chance that a legitimate email is ever wrongly sent to the spam folder, even if that means a few spam emails slip through. Which metric should be prioritized for the spam class?",
        "options": [
            "Precision for the spam class",
            "Recall for the spam class",
            "Specificity for the spam class",
            "Raw count of true positives alone",
        ],
        "correct": 0,
        "explanation": "Prioritizing precision for the spam class means being conservative about labelling something spam, which directly minimizes false positives — legitimate emails wrongly flagged as spam."
    },
    {
        "id": "evalgen-metric-003", "topic": "evaluation-and-general",
        "subtopic": "Choosing the right metric", "difficulty": "recall",
        "q": "Which evaluation metric is threshold-independent, summarizing performance across every possible decision threshold at once?",
        "options": [
            "ROC-AUC",
            "Precision at a fixed 0.5 threshold",
            "Accuracy at a fixed 0.5 threshold",
            "F1-score at a fixed 0.5 threshold",
        ],
        "correct": 0,
        "explanation": "ROC-AUC is computed by sweeping across all thresholds, so it summarizes ranking quality independent of any single chosen cutoff, unlike precision, accuracy, or F1 which are evaluated at one fixed threshold."
    },
    {
        "id": "evalgen-metric-004", "topic": "evaluation-and-general",
        "subtopic": "Choosing the right metric", "difficulty": "application",
        "q": "A customer-churn model is evaluated on a dataset where only 4% of customers actually churn. The team reports 96% accuracy and considers the model excellent. What is the flaw in this conclusion?",
        "options": [
            "A trivial always-predict-\"no churn\" model also scores ~96% accuracy",
            "96% accuracy is mathematically impossible on any real dataset",
            "Accuracy can only ever be computed for regression tasks",
            "Accuracy here was, by definition, computed only on the training set used",
        ],
        "correct": 0,
        "explanation": "With a 96%/4% class split, a trivial always-predict-majority-class model reaches ~96% accuracy without learning anything, which is exactly why accuracy is a misleading metric for imbalanced classification."
    },
    {
        "id": "evalgen-metric-005", "topic": "evaluation-and-general",
        "subtopic": "Choosing the right metric", "difficulty": "recall",
        "q": "F1-score is defined as which combination of precision and recall?",
        "options": [
            "Their harmonic mean",
            "Their simple arithmetic mean",
            "Their class-size-weighted geometric mean",
            "The larger of the two values",
        ],
        "correct": 0,
        "explanation": "F1 = 2 * (precision * recall) / (precision + recall), which is the harmonic mean — it penalizes a large gap between precision and recall more heavily than a simple average would."
    },
    # --- Cross-validation / splits (general ML knowledge) ---
    {
        "id": "evalgen-gen-001", "topic": "evaluation-and-general",
        "subtopic": "Cross-validation and data splits", "difficulty": "recall",
        "q": "Why is k-fold cross-validation generally preferred over a single train/validation split when data is limited?",
        "options": [
            "Every example gets used for validation at some point, giving a steadier estimate",
            "It guarantees that the model will never overfit the training data",
            "It removes the need for ever holding out a separate test set",
            "It is always computationally faster than running a single train/test split would be",
        ],
        "correct": 0,
        "explanation": "By rotating which fold is held out, cross-validation uses all the data for validation at some point, averaging out the noise of any single lucky or unlucky split and giving a more stable performance estimate."
    },
    {
        "id": "evalgen-gen-002", "topic": "evaluation-and-general",
        "subtopic": "Cross-validation and data splits", "difficulty": "application",
        "q": "A team tunes hyperparameters by repeatedly checking performance on their single held-out test set and picking whichever configuration scores highest on it. What is the main risk in this practice?",
        "options": [
            "The test set effectively leaks into tuning, inflating the reported score",
            "Hyperparameter tuning of any kind is never a valid practice",
            "Model performance will be identical no matter how it's tuned",
            "This slows training down somewhat but leaves the reported accuracy completely unbiased",
        ],
        "correct": 0,
        "explanation": "Repeatedly selecting based on test-set performance turns the test set into a de facto validation set — the final reported number no longer reflects performance on truly unseen data, a classic form of leakage."
    },
    {
        "id": "evalgen-gen-003", "topic": "evaluation-and-general",
        "subtopic": "Cross-validation and data splits", "difficulty": "application",
        "q": "A medical dataset has 92% healthy patients and 8% patients with a rare condition. When splitting into train and test sets, why would a stratified split be preferred over a plain random split?",
        "options": [
            "It keeps the same class proportions in both the train and test sets",
            "It always produces a noticeably larger training set than random splitting",
            "It removes the need for any evaluation metric besides raw accuracy",
            "It guarantees the trained model will reach 100% recall on the rare class",
        ],
        "correct": 0,
        "explanation": "With a severe class imbalance, a plain random split can by chance leave the test set with very few (or disproportionately many) rare-class examples; stratifying ensures both splits mirror the original class balance."
    },
    {
        "id": "evalgen-gen-004", "topic": "evaluation-and-general",
        "subtopic": "Data leakage and preprocessing order", "difficulty": "analysis",
        "q": "A team scales all features (e.g. using StandardScaler) on the entire dataset before splitting into train and test sets, then trains and evaluates the model. What is the problem with this order of operations?",
        "options": [
            "Test-set statistics leak into training, inflating the reported evaluation",
            "Feature scaling never affects any model's performance either way",
            "This exact order is strictly required for every tree-based model to run at all",
            "This order only slows training down without biasing the results",
        ],
        "correct": 0,
        "explanation": "Fitting the scaler on the full dataset lets test-set statistics influence the transformation applied to training data — a subtle form of data leakage. The scaler should be fit on the training split only, then applied to the test split."
    },
    {
        "id": "evalgen-gen-005", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "recall",
        "q": "In the bias-variance decomposition of prediction error, which term represents the error that remains even for the best possible model, due to inherent noise in the data-generating process?",
        "options": [
            "Irreducible error",
            "Bias error",
            "Variance error",
            "Regularization error",
        ],
        "correct": 0,
        "explanation": "Irreducible error (noise) is the portion of error no model can eliminate, independent of bias (systematic underfitting error) and variance (sensitivity to the particular training sample)."
    },
    {
        "id": "evalgen-gen-006", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "application",
        "q": "A retail company has 40,000 customer records with 200 features, non-linear relationships, multicollinearity, and imbalanced classes. Which general modelling strategy is most appropriate as a starting point?",
        "options": [
            "A tree-based ensemble, which tolerates non-linearity and correlated features well",
            "A single linear regression model, since it is always the safest default",
            "K-means clustering, since the task already has labels available",
            "A plain Naive Bayes classifier, since feature correlation never affects its predictions",
        ],
        "correct": 0,
        "explanation": "Tree-based ensembles naturally capture non-linear relationships and are far more robust to multicollinearity and unscaled features than linear models, making them a strong default for this kind of messy tabular data."
    },
    {
        "id": "evalgen-gen-007", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "recall",
        "q": "What is the main purpose of a validation set that is separate from both the training set and the final test set?",
        "options": [
            "To tune hyperparameters without touching the final test evaluation",
            "To increase the total amount of labeled data available for training runs",
            "To replace the need for cross-validation entirely",
            "To store a backup copy of the raw training data",
        ],
        "correct": 0,
        "explanation": "The validation set is where iterative decisions (hyperparameters, early stopping, model choice) get made, keeping the test set reserved as a single, unbiased final check on generalization."
    },
    {
        "id": "evalgen-gen-008", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "application",
        "q": "A hospital wants a model that not only predicts readmission risk but can also justify each prediction to clinicians and regulators. Beyond raw predictive accuracy, which additional property should weigh heavily in model selection?",
        "options": [
            "Interpretability of individual predictions, not just overall accuracy",
            "The total number of hyperparameters that the chosen model happens to expose",
            "Whether the model happened to be trained using a GPU",
            "The raw size, in gigabytes, of the training dataset used",
        ],
        "correct": 0,
        "explanation": "In regulated, high-stakes domains like healthcare, the ability to explain why a prediction was made (via inherently interpretable models or post-hoc tools like SHAP/LIME) is often as important as raw accuracy."
    },
    {
        "id": "evalgen-gen-009", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "recall",
        "q": "What does \"early stopping\" refer to during model training?",
        "options": [
            "Halting training once validation performance stops improving",
            "Stopping data collection before enough rows have been gathered",
            "Using only the first few training examples in every single epoch",
            "Skipping the final test-set evaluation step after training ends",
        ],
        "correct": 0,
        "explanation": "Early stopping monitors validation performance during training and stops once it plateaus or degrades, preventing the model from continuing to fit training-set noise."
    },
    {
        "id": "evalgen-gen-010", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "application",
        "q": "A team is choosing between several candidate models that all score similarly on the validation metric. Which additional factor is a reasonable tie-breaker in a real production setting?",
        "options": [
            "Inference latency and interpretability in the deployment environment",
            "Whichever candidate model happens to expose the most tunable hyperparameters",
            "Whichever candidate model's name sorts first alphabetically",
            "Whichever candidate model took the longest time to train",
        ],
        "correct": 0,
        "explanation": "When validation performance is statistically tied, practical deployment concerns — speed, explainability, resource cost, ease of maintenance — are legitimate, commonly used tie-breakers."
    },
    # --- extra ROC / PR / bar / bias-variance chart variety ---
    {
        "id": "evalgen-chart-008", "topic": "evaluation-and-general",
        "subtopic": "ROC curve reading", "difficulty": "application",
        "q": "A credit-scoring model's ROC curve rises very steeply near the origin, reaching a true-positive rate above 0.9 while the false-positive rate is still below 0.1, before flattening out toward (1,1). What does this curve shape indicate?",
        "chart": {"type": "roc", "shape": "excellent", "caption": "Figure: ROC curve"},
        "options": [
            "Strong separation between classes, with few false alarms for most true positives caught",
            "Performance no better than a random coin-flip classifier",
            "Overfitting, with no other evidence needed to reach that conclusion",
            "That the data was never actually split into train and test sets",
        ],
        "correct": 0,
        "explanation": "A curve that hugs the top-left corner (high TPR at low FPR) corresponds to a high AUC and strong class separation — the hallmark of a well-performing classifier at that operating point."
    },
    {
        "id": "evalgen-chart-009", "topic": "evaluation-and-general",
        "subtopic": "Precision-Recall curve reading", "difficulty": "application",
        "q": "For a rare-disease-detection model, a colleague suggests using the ROC-AUC alone to judge performance. Given that positives are only 2% of the data, why might a Precision-Recall curve be a more informative companion chart?",
        "chart": {"type": "pr", "shape": "gradual", "caption": "Figure: Precision-Recall curve"},
        "options": [
            "ROC-AUC can look deceptively high on severe imbalance, while PR stays sensitive to the minority class",
            "ROC curves simply cannot be plotted at all when classes are imbalanced",
            "Precision-Recall curves are the only curves that ignore the decision threshold",
            "ROC-AUC and PR-AUC are always numerically identical values",
        ],
        "correct": 0,
        "explanation": "With heavy imbalance, the huge number of true negatives keeps the false-positive rate low even when false positives are numerous relative to the rare positives, inflating ROC-AUC; PR curves, built from precision and recall, stay sensitive to minority-class performance."
    },
    {
        "id": "evalgen-chart-010", "topic": "evaluation-and-general",
        "subtopic": "Feature-importance chart reading", "difficulty": "application",
        "q": "A hiring-screening model's feature-importance chart shows \"Postal Code\" ranked as the third most important feature, despite not being an explicit job qualification. What should this prompt the team to check?",
        "chart": {"type": "bar", "labels": ["Years Experience", "Education Level", "Postal Code", "Interview Score", "Certifications"], "values": [0.30, 0.22, 0.18, 0.21, 0.09], "caption": "Figure: Feature importance"},
        "options": [
            "Whether postal code is acting as a proxy for a protected attribute",
            "Whether the model's learning rate has simply been set too high",
            "Whether the available dataset has too few rows to train on",
            "Whether the kernel trick was somehow applied incorrectly here",
        ],
        "correct": 0,
        "explanation": "A geographic feature contributing meaningfully to a hiring decision is a red flag for proxy discrimination — postal codes often correlate with protected demographic attributes, so this warrants a fairness audit, not just a performance check."
    },
    {
        "id": "evalgen-chart-011", "topic": "evaluation-and-general",
        "subtopic": "Bias-variance curve reading", "difficulty": "application",
        "q": "A plot of training and validation error against model complexity shows both curves decreasing together and converging to a low, similar error value, then staying flat as complexity increases further. What does this represent?",
        "chart": {"type": "bias_variance", "shape": "good_fit", "caption": "Figure: Error vs model complexity"},
        "options": [
            "A well-fit model, balancing bias and variance at that complexity",
            "A severely overfit model despite the converging error curves",
            "A severely underfit model despite the low converged error",
            "Clear evidence the dataset contains many duplicate rows",
        ],
        "correct": 0,
        "explanation": "Training and validation error converging to a low, similar value is the signature of a good bias-variance balance — the model is complex enough to capture the pattern without fitting noise."
    },
    # --- more metric-selection / statistics ---
    {
        "id": "evalgen-metric-006", "topic": "evaluation-and-general",
        "subtopic": "Choosing the right metric", "difficulty": "recall",
        "q": "In classification terminology, a false positive corresponds to which kind of statistical error?",
        "options": [
            "A Type I error, wrongly flagging a negative case as positive",
            "A Type II error, wrongly letting a positive case pass as negative",
            "An irreducible error, inherent to the data-generating process",
            "A sampling error, caused by how the test set was collected",
        ],
        "correct": 0,
        "explanation": "A false positive wrongly flags a negative case as positive, which corresponds to a Type I error; a false negative (missing a real positive) corresponds to a Type II error."
    },
    {
        "id": "evalgen-metric-007", "topic": "evaluation-and-general",
        "subtopic": "Choosing the right metric", "difficulty": "application",
        "q": "Macro-averaged F1 across three classes gives each class's F1 score equal weight regardless of how many examples that class has, while micro-averaged F1 effectively weights by sample count. On a dataset where one class is far rarer than the others, which would reveal poor performance on the rare class more clearly?",
        "options": [
            "Macro-averaged F1, since frequent classes can't drown out the rare one",
            "Micro-averaged F1, since it always penalizes rare classes more heavily",
            "Both behave exactly the same regardless of the class balance",
            "Neither of the two averages is affected by class frequency at all",
        ],
        "correct": 0,
        "explanation": "Macro-averaging treats every class equally when combining per-class scores, so a rare class performing poorly pulls the macro average down noticeably, whereas micro-averaging is dominated by the frequent classes."
    },
    {
        "id": "evalgen-gen-011", "topic": "evaluation-and-general",
        "subtopic": "Handling imbalanced data", "difficulty": "application",
        "q": "A fraud dataset has only 0.5% positive (fraud) cases. Besides changing the evaluation metric, which technique directly addresses the imbalance during model training?",
        "options": [
            "Oversampling the minority class (e.g. SMOTE) or using class weights",
            "Simply reducing the total number of input features used",
            "Increasing the optimizer's learning rate during training",
            "Switching entirely to an unsupervised clustering approach",
        ],
        "correct": 0,
        "explanation": "Techniques like SMOTE (synthetic oversampling) or class-weighted loss functions directly counteract imbalance during training, rather than just changing how performance is measured afterward."
    },
    {
        "id": "evalgen-gen-012", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "recall",
        "q": "Which of these is an example of a hyperparameter, as opposed to a parameter learned during training?",
        "options": [
            "The learning rate used by a gradient-descent optimizer",
            "The weight vector fitted by a linear regression model",
            "The support vectors identified after training an SVM",
            "The split thresholds chosen inside a trained decision tree",
        ],
        "correct": 0,
        "explanation": "Hyperparameters (like learning rate, K in KNN, or C in SVM) are set before training and control the learning process itself, whereas parameters (weights, split thresholds, support vectors) are learned from the data during training."
    },
    {
        "id": "evalgen-gen-013", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "application",
        "q": "A dataset contains a categorical feature \"City\" with 500 distinct values. One-hot encoding this feature directly would create 500 new columns. What is the main practical concern with doing this naively?",
        "options": [
            "A large jump in dimensionality and sparsity that hurts distance-based models",
            "One-hot encoding being mathematically impossible past ten total categories in any dataset",
            "The resulting model being guaranteed to underfit the data",
            "The target variable's class imbalance being fixed automatically",
        ],
        "correct": 0,
        "explanation": "High-cardinality categorical one-hot encoding blows up dimensionality and sparsity, which is especially harmful for distance-based methods like KNN or SVM with certain kernels, and increases training cost generally."
    },
    {
        "id": "evalgen-gen-014", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "application",
        "q": "A dataset has several numeric features on wildly different scales (e.g. age in years, income in hundreds of thousands). For which type of model is feature scaling LEAST likely to change the result?",
        "options": [
            "A decision tree, since each split only looks at one feature's threshold",
            "K-Nearest Neighbors, since it relies directly on pairwise distance calculations",
            "A Support Vector Machine using an RBF kernel",
            "K-means clustering, since it relies directly on distance calculations",
        ],
        "correct": 0,
        "explanation": "Tree-based models split on one feature's threshold at a time and don't compare magnitudes across features directly, so they are largely invariant to monotonic feature scaling — unlike distance- or margin-based methods such as KNN, SVM, or K-means."
    },
    {
        "id": "evalgen-gen-015", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "recall",
        "q": "What is the main difference between parametric and non-parametric machine learning models?",
        "options": [
            "Parametric models fix their parameter count; non-parametric ones can grow with data",
            "Parametric models can only ever be used for regression tasks",
            "Non-parametric models never require any training data whatsoever",
            "Parametric models always outperform non-parametric ones on large data",
        ],
        "correct": 0,
        "explanation": "Parametric models (e.g. linear/logistic regression) fix the number of parameters regardless of dataset size; non-parametric models (e.g. KNN, decision trees) can effectively grow in complexity as more data becomes available."
    },
    {
        "id": "evalgen-gen-016", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "application",
        "q": "A dataset has 5% missing values scattered across several numeric columns, with no apparent pattern to which rows are missing. Which strategy is a reasonable default for handling this before modelling?",
        "options": [
            "Impute the missing values rather than silently dropping those rows",
            "Always drop every row with any missing value, no matter the cost",
            "Fill every missing value with zero without checking if that's valid",
            "Ignore the missing values, trusting libraries to handle them silently",
        ],
        "correct": 0,
        "explanation": "When missingness appears to be random and data is limited, imputation (median/mean for numeric, or a more sophisticated model-based approach) typically preserves more signal than dropping rows outright, and is safer than an arbitrary fill value like zero."
    },
    {
        "id": "evalgen-gen-017", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "recall",
        "q": "What does \"model drift\" broadly refer to, as a general ML concept (independent of whether it's data drift or concept drift)?",
        "options": [
            "A deployed model's performance degrading as its real-world conditions change",
            "The random variation in predictions caused only by different random seeds each run",
            "A bug where model weights change at inference time without retraining",
            "The ordinary decrease in training loss seen during gradient descent",
        ],
        "correct": 0,
        "explanation": "Model drift describes the general phenomenon of a deployed model's accuracy declining as the environment it operates in evolves away from the conditions present during training — whether the input distribution changes (data drift) or the underlying relationship changes (concept drift)."
    },
    {
        "id": "evalgen-gen-018", "topic": "evaluation-and-general",
        "subtopic": "General ML knowledge", "difficulty": "application",
        "q": "A team wants to compare two models' accuracy scores (91.2% vs 91.8%) measured on the same, fairly small test set. What should they check before concluding the second model is meaningfully better?",
        "options": [
            "Whether that gap is statistically significant given the test-set size",
            "Whether the two model names happen to be in alphabetical order",
            "Whether both models used exactly the same number of hyperparameters",
            "Nothing else — any positive numeric gap is automatically meaningful",
        ],
        "correct": 0,
        "explanation": "On a small test set, a 0.6 percentage-point gap can easily be noise; a proper comparison checks whether the difference is statistically significant (e.g. via a paired test or confidence interval) before declaring one model superior."
    },
]


def main():
    confusion_qs = gen_confusion_questions(55)
    all_qs = confusion_qs + HAND_WRITTEN
    for i, q in enumerate(all_qs, start=1):
        pass  # ids already set individually; just validate below

    bad = [q for q in all_qs if len(q["options"]) != 4 or q["correct"] != 0]
    if bad:
        raise SystemExit(f"{len(bad)} malformed question(s)")

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(all_qs, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(all_qs)} questions to {OUT}")
    subs = {}
    for q in all_qs:
        subs[q["subtopic"]] = subs.get(q["subtopic"], 0) + 1
    for s, c in sorted(subs.items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")


if __name__ == "__main__":
    main()
