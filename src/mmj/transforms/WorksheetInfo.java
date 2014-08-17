package mmj.transforms;

import java.util.*;

import mmj.lang.*;
import mmj.pa.*;
import mmj.verify.VerifyProofs;

/**
 * Information about work sheet.
 * <p>
 * This class has local package visibility.
 */
/*local*/class WorksheetInfo {
    private final boolean finished = false;

    public final ProofWorksheet proofWorksheet;
    public final DerivationStep derivStep;

    public final List<DerivationStep> newSteps = new ArrayList<DerivationStep>();

    public final TransformationManager trManager;

    private final VerifyProofs verifyProofs;
    private final Cnst provableLogicStmtTyp;

    public WorksheetInfo(final ProofWorksheet proofWorksheet,
        final DerivationStep derivStep, final TransformationManager trManager)
    {
        super();
        this.proofWorksheet = proofWorksheet;
        this.derivStep = derivStep;
        this.trManager = trManager;
        verifyProofs = trManager.verifyProofs;
        provableLogicStmtTyp = trManager.provableLogicStmtTyp;
    }

    public ProofStepStmt getProofStepStmt(final ParseNode stepNode) {
        assert !finished;
        final ProofStepStmt stepTr = getOrCreateProofStepStmt(stepNode, null,
            null);
        return stepTr;
    }

    public ProofStepStmt getOrCreateProofStepStmt(final ParseNode root,
        final ProofStepStmt[] hyps, final Assrt assrt)
    {
        assert !finished;
        final ParseTree tree = new ParseTree(root);
        final Formula generatedFormula = verifyProofs.convertRPNToFormula(
            tree.convertToRPN(), "tree"); // TODO: use constant
        generatedFormula.setTyp(provableLogicStmtTyp);

        final ProofStepStmt findMatchingStepFormula = proofWorksheet
            .findMatchingStepFormula(generatedFormula, derivStep);

        if (findMatchingStepFormula != null)
            return findMatchingStepFormula;

        if (hyps == null || assrt == null)
            return null;

        assert assrt.getLogHypArray().length == hyps.length;

        final String[] steps = new String[hyps.length];
        for (int i = 0; i < hyps.length; i++)
            steps[i] = hyps[i].getStep();

        final DerivationStep d = proofWorksheet.addDerivStep(derivStep, hyps,
            steps, assrt.getLabel(), generatedFormula, tree,
            Collections.<WorkVar> emptyList());
        d.setRef(assrt);
        // d.unificationStatus = PaConstants.UNIFICATION_STATUS_UNIFIED;
        newSteps.add(d);
        return d;
    }

    public void finishDerivationStep(final ProofStepStmt[] hypDerivArray,
        final Assrt assrt)
    {
        assert !finished;
        final String[] hypStep = new String[hypDerivArray.length];
        for (int i = 0; i < hypStep.length; i++)
            hypStep[i] = hypDerivArray[i].getStep();

        derivStep.setRef(assrt);
        derivStep.setRefLabel(assrt.getLabel());
        derivStep.setHypList(hypDerivArray);
        derivStep.setHypStepList(hypStep);
        derivStep.setAutoStep(false);
        // confirm unification for derivStep also!
        newSteps.add(derivStep);
    }

    public static class SubstParam {
        final ProofStepStmt[] hypDerivArray;
        final Assrt assrt;

        public SubstParam(final ProofStepStmt[] hypDerivArray, final Assrt assrt)
        {
            this.hypDerivArray = hypDerivArray;
            this.assrt = assrt;
        }
    }
}
