import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Role Selection & Auth
import RoleSelector from './components/RoleSelector';
import RecruiterAuth from './components/RecruiterAuth';
import CodeEntry from './components/CodeEntry';

// Recruiter Components
import RecruiterDashboard from './components/RecruiterDashboard';
import CodeGenerator from './components/CodeGenerator';

// Applicant/Shared Components
import ResumeInput from './components/ResumeInput';
import InterviewChat from './components/InterviewChat';
import RecruiterView from './components/RecruiterView';
import CandidateFeedbackView from './components/CandidateFeedbackView';

// Engine imports
import { mapSkillsToRequirements, identifyFocusSkills } from './engine/SkillMapper';
import { generateInterviewQuestions, generateOpeningQuestion, generateClosingQuestion } from './engine/QuestionGenerator';
import { calculateOverallAuthenticity, generateAuthenticityReport } from './engine/AuthenticityScorer';
import { calculateEvaluationMetrics, makeDecision, generateRecruiterReport, generateCandidateFeedback } from './engine/DecisionEngine';

// API
import { getCurrentUser, startApplicantScreening, updateScreening, fetchScreening, getAuthToken } from './services/api';

// AI Service (Gemini)
import { isAIAvailable, parseResumeWithAI, generateAIReport } from './services/aiService';

import './index.css';

// App phases
const PHASES = {
  LOADING: 'loading',
  ROLE_SELECT: 'role_select',
  // Recruiter phases
  RECRUITER_AUTH: 'recruiter_auth',
  RECRUITER_DASHBOARD: 'recruiter_dashboard',
  RECRUITER_CREATE: 'recruiter_create',
  RECRUITER_VIEW_RESULT: 'recruiter_view_result',
  // Applicant phases
  APPLICANT_CODE: 'applicant_code',
  APPLICANT_RESUME: 'applicant_resume',
  APPLICANT_INTERVIEW: 'applicant_interview',
  APPLICANT_PROCESSING: 'applicant_processing',
  APPLICANT_RESULTS: 'applicant_results',
};

export default function App() {
  const [phase, setPhase] = useState(PHASES.LOADING);
  const [userRole, setUserRole] = useState(null); // 'recruiter' | 'applicant'
  const [recruiter, setRecruiter] = useState(null);

  // Applicant state
  const [applicantData, setApplicantData] = useState(null); // { code, email, name, screening }
  const [screeningId, setScreeningId] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [skillMapping, setSkillMapping] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [recruiterReport, setRecruiterReport] = useState(null);
  const [candidateFeedback, setCandidateFeedback] = useState(null);
  const [aiResumeData, setAiResumeData] = useState(null); // AI-parsed resume data

  // For viewing past results
  const [viewingSubmission, setViewingSubmission] = useState(null);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (getAuthToken()) {
      try {
        const user = await getCurrentUser();
        if (user) {
          setRecruiter(user);
          setUserRole('recruiter');
          setPhase(PHASES.RECRUITER_DASHBOARD);
          return;
        }
      } catch {
        // Token invalid, continue to role select
      }
    }
    setPhase(PHASES.ROLE_SELECT);
  };

  // Role selection
  const handleSelectRole = (role) => {
    setUserRole(role);
    if (role === 'recruiter') {
      setPhase(PHASES.RECRUITER_AUTH);
    } else {
      setPhase(PHASES.APPLICANT_CODE);
    }
  };

  // Recruiter auth success
  const handleRecruiterAuth = (recruiterData) => {
    setRecruiter(recruiterData);
    setPhase(PHASES.RECRUITER_DASHBOARD);
  };

  // Recruiter logout
  const handleRecruiterLogout = () => {
    setRecruiter(null);
    setUserRole(null);
    setPhase(PHASES.ROLE_SELECT);
  };

  // Recruiter views a submission
  const handleViewSubmission = async (submission) => {
    try {
      const fullData = await fetchScreening(submission.id);
      setViewingSubmission(fullData);
      setRecruiterReport(fullData.recruiter_report);
      setCandidateFeedback(fullData.candidate_feedback);
      setPhase(PHASES.RECRUITER_VIEW_RESULT);
    } catch (error) {
      console.error('Failed to load submission:', error);
    }
  };

  // Applicant code validated
  const handleCodeValidated = (data) => {
    setApplicantData(data);
    setCandidateName(data.name);
    setPhase(PHASES.APPLICANT_RESUME);
  };

  // Resume submitted - create job description from screening data
  const handleResumeSubmit = async (resume, extractedName) => {
    setResumeText(resume);
    setCandidateName(extractedName || applicantData.name);

    // Convert screening data to job description format
    const jobDescription = {
      title: applicantData.screening.roleTitle,
      experienceLevel: applicantData.screening.experienceLevel,
      requiredSkills: applicantData.screening.requiredSkills || [],
      preferredSkills: applicantData.screening.preferredSkills || [],
      description: applicantData.screening.jobDescription || '',
    };

    // Start screening in database
    try {
      const result = await startApplicantScreening(
        applicantData.code,
        applicantData.email,
        extractedName || applicantData.name,
        resume
      );
      setScreeningId(result.screeningId);
    } catch (error) {
      console.error('Failed to start screening:', error);
    }

    // Map skills
    const mapping = mapSkillsToRequirements(resume, jobDescription);
    setSkillMapping(mapping);

    // Try AI-powered resume parsing (non-blocking enhancement)
    if (isAIAvailable()) {
      parseResumeWithAI(resume, jobDescription).then(aiResult => {
        if (aiResult?.success) {
          setAiResumeData(aiResult.data);
          console.log('AI Resume parsing complete:', aiResult.data);
        }
      }).catch(err => console.log('AI parsing skipped:', err.message));
    }

    // Generate questions
    const focusSkills = identifyFocusSkills(mapping);
    const opening = generateOpeningQuestion(jobDescription);
    const mainQuestions = generateInterviewQuestions(mapping, focusSkills, 2);
    const closing = generateClosingQuestion();

    setQuestions([opening, ...mainQuestions, closing]);
    setPhase(PHASES.APPLICANT_INTERVIEW);
  };

  // Interview completed
  const handleInterviewComplete = async (qaPairs) => {
    setPhase(PHASES.APPLICANT_PROCESSING);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const jobDescription = {
      title: applicantData.screening.roleTitle,
      experienceLevel: applicantData.screening.experienceLevel,
      requiredSkills: applicantData.screening.requiredSkills || [],
    };

    // Calculate authenticity
    const overallAuth = calculateOverallAuthenticity(qaPairs);
    const authReport = generateAuthenticityReport(overallAuth, qaPairs);

    // Calculate metrics and decision
    const metrics = calculateEvaluationMetrics(skillMapping, authReport, qaPairs);
    const decision = makeDecision(metrics, skillMapping, authReport);

    // Generate reports
    const recReport = generateRecruiterReport(decision, skillMapping, authReport, jobDescription);
    const candFeedback = generateCandidateFeedback(decision, skillMapping, jobDescription);

    recReport.candidateName = candidateName;
    recReport.jobTitle = jobDescription.title;
    candFeedback.candidateName = candidateName;
    candFeedback.jobTitle = jobDescription.title;

    // Enhance with AI report if available
    if (isAIAvailable()) {
      try {
        const aiReport = await generateAIReport(
          { questions, answers: qaPairs.map(qa => qa.answer) },
          aiResumeData,
          jobDescription
        );
        if (aiReport?.success) {
          // Merge AI insights into reports
          recReport.aiInsights = aiReport.data;
          candFeedback.aiInsights = aiReport.data;
          console.log('AI Report generated:', aiReport.data);
        }
      } catch (err) {
        console.log('AI report skipped:', err.message);
      }
    }

    setRecruiterReport(recReport);
    setCandidateFeedback(candFeedback);

    // Save to database
    if (screeningId) {
      try {
        // Map decision to verdict: PASS->pass, HOLD->hold, REJECT->fail
        const verdictMap = { 'PASS': 'pass', 'HOLD': 'hold', 'REJECT': 'fail' };
        const verdict = verdictMap[decision.decision] || 'pending';

        await updateScreening(screeningId, {
          candidateName,
          trustScore: decision.overallScore || 0,
          skillMatchScore: skillMapping?.skillMatchScore || 0,
          authenticityScore: authReport?.summary?.score || authReport?.score || 0,
          communicationScore: metrics?.communication || 0,
          verdict,
          verdictSummary: decision.reasons?.join('. ') || '',
          skillMapping,
          authenticityReport: authReport,
          qaPairs,
          recruiterReport: recReport,
          candidateFeedback: candFeedback,
        });
      } catch (error) {
        console.error('Failed to save results:', error);
      }
    }

    setPhase(PHASES.APPLICANT_RESULTS);
  };

  // Reset to start
  const handleReset = () => {
    setApplicantData(null);
    setScreeningId(null);
    setResumeText('');
    setCandidateName('');
    setSkillMapping(null);
    setQuestions([]);
    setRecruiterReport(null);
    setCandidateFeedback(null);
    setViewingSubmission(null);

    if (userRole === 'recruiter') {
      setPhase(PHASES.RECRUITER_DASHBOARD);
    } else {
      setPhase(PHASES.ROLE_SELECT);
    }
  };

  // Back to role select
  const handleBackToRoleSelect = () => {
    setUserRole(null);
    setPhase(PHASES.ROLE_SELECT);
  };

  return (
    <div className="min-h-screen w-full bg-mesh">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {phase === PHASES.LOADING && (
            <motion.div
              key="loading"
              className="min-h-screen flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="size-12 mx-auto mb-4 border-4 border-card-dark border-t-primary rounded-full animate-spin" />
                <p className="text-text-muted">Loading...</p>
              </div>
            </motion.div>
          )}

          {/* Role Selection */}
          {phase === PHASES.ROLE_SELECT && (
            <motion.div key="role" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RoleSelector onSelectRole={handleSelectRole} />
            </motion.div>
          )}

          {/* Recruiter Auth */}
          {phase === PHASES.RECRUITER_AUTH && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RecruiterAuth onSuccess={handleRecruiterAuth} onBack={handleBackToRoleSelect} />
            </motion.div>
          )}

          {/* Recruiter Dashboard */}
          {phase === PHASES.RECRUITER_DASHBOARD && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="max-w-7xl mx-auto p-8">
                <RecruiterDashboard
                  recruiter={recruiter}
                  onCreateNew={() => setPhase(PHASES.RECRUITER_CREATE)}
                  onLogout={handleRecruiterLogout}
                  onViewSubmission={handleViewSubmission}
                />
              </div>
            </motion.div>
          )}

          {/* Recruiter Create Test */}
          {phase === PHASES.RECRUITER_CREATE && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="max-w-7xl mx-auto p-8">
                <CodeGenerator
                  onComplete={() => setPhase(PHASES.RECRUITER_DASHBOARD)}
                  onBack={() => setPhase(PHASES.RECRUITER_DASHBOARD)}
                />
              </div>
            </motion.div>
          )}

          {/* Recruiter View Result */}
          {phase === PHASES.RECRUITER_VIEW_RESULT && recruiterReport && (
            <motion.div key="view-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="max-w-7xl mx-auto p-8">
                <RecruiterView
                  report={recruiterReport}
                  candidateName={viewingSubmission?.candidate_name}
                  onViewCandidate={() => setPhase(PHASES.APPLICANT_RESULTS)}
                  onReset={handleReset}
                  isViewOnly={true}
                />
              </div>
            </motion.div>
          )}

          {/* Applicant Code Entry */}
          {phase === PHASES.APPLICANT_CODE && (
            <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CodeEntry onSuccess={handleCodeValidated} onBack={handleBackToRoleSelect} />
            </motion.div>
          )}

          {/* Applicant Resume */}
          {phase === PHASES.APPLICANT_RESUME && (
            <motion.div key="resume" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="max-w-7xl mx-auto p-8">
                <ResumeInput
                  onSubmit={handleResumeSubmit}
                  onBack={() => setPhase(PHASES.APPLICANT_CODE)}
                  jobDescription={{
                    title: applicantData?.screening?.roleTitle,
                    requiredSkills: applicantData?.screening?.requiredSkills || [],
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Applicant Interview */}
          {phase === PHASES.APPLICANT_INTERVIEW && (
            <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="max-w-7xl mx-auto p-8 h-screen">
                <InterviewChat
                  questions={questions}
                  onComplete={handleInterviewComplete}
                  skillMapping={skillMapping}
                  jobDescription={{ title: applicantData?.screening?.roleTitle }}
                  candidateName={candidateName}
                  aiSuggestedQuestions={aiResumeData?.suggestedQuestions || []}
                />
              </div>
            </motion.div>
          )}

          {/* Applicant Processing */}
          {phase === PHASES.APPLICANT_PROCESSING && (
            <motion.div
              key="processing"
              className="min-h-screen flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="relative inline-block mb-8">
                  <div className="w-20 h-20 border-4 border-card-dark border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Analyzing Your Responses...</h2>
                <p className="text-text-muted">Calculating scores and generating feedback</p>
              </div>
            </motion.div>
          )}

          {/* Applicant Results */}
          {phase === PHASES.APPLICANT_RESULTS && candidateFeedback && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="max-w-7xl mx-auto p-8">
                <CandidateFeedbackView
                  feedback={candidateFeedback}
                  candidateName={candidateName}
                  onBack={handleReset}
                  onReset={handleReset}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
