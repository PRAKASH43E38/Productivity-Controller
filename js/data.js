// Data constants for ProductiveX OS

const ROADMAP = {
  python: {
    label: "Python",
    topics: [
      "Variables", "Data Types", "Operators", "Strings", "Lists", "Tuples",
      "Sets", "Dictionaries", "Functions", "Lambda Functions", "OOP",
      "Exception Handling", "File Handling", "Modules", "Iterators",
      "Generators", "Decorators", "Virtual Environment"
    ]
  },
  numpy: {
    label: "NumPy",
    topics: [
      "Arrays", "Array Creation", "Indexing", "Slicing", "Reshaping", "Broadcasting", "Vectorization"
    ]
  },
  pandas: {
    label: "Pandas",
    topics: [
      "Series", "DataFrame", "Import Data", "Cleaning", "Filtering", "GroupBy", "Merge"
    ]
  },
  sql: {
    label: "SQL",
    topics: [
      "SELECT", "WHERE", "ORDER BY", "GROUP BY", "JOINS"
    ]
  },
  statistics: {
    label: "Statistics",
    topics: [
      "Mean", "Median", "Mode", "Variance", "Standard Deviation", "Probability", "Distributions"
    ]
  },
  dseda: {
    label: "DS & EDA",
    topics: [
      "Data Cleaning", "Missing Values", "Outlier Detection", "Feature Understanding", "Visualization", "Correlation", "EDA Project"
    ]
  },
  projects: {
    label: "Projects",
    topics: [
      "Student Marks Analysis", "Cricket Statistics Analysis", "Netflix Dataset Analysis", "IPL Dataset Analysis", "Customer Churn Analysis"
    ]
  },
  ml: {
    label: "Machine Learning",
    topics: [
      "Supervised Learning", "Unsupervised Learning", "Linear Regression", "Logistic Regression", "Decision Tree", "Random Forest", "Model Evaluation"
    ]
  }
};

const DAILY_TASKS = {
  morning:   ["Wake Up On Time", "Morning Routine", "Workout/Physical Activity"],
  learning:  ["Python Practice", "NumPy Practice", "Pandas Practice", "SQL Practice", "Statistics Practice", "DS & EDA Study", "ML Concepts"],
  projects:  ["Project Building", "GitHub Update"],
  other:     ["Technical Reading", "Communication Practice"]
};

const HABITS = [
  "Wake Up On Time", 
  "Workout", 
  "Deep Work", 
  "Focus Training",
  "Communication Practice", 
  "Learning Session",
  "Project Work", 
  "Reading", 
  "Daily Planning"
];

const DEFAULT_PROJECTS = [
  { id: 1, name: "Student Marks Analysis",      status: "Not Started", progress: 0, startDate: "", endDate: "", notes: "Perform exploratory data analysis on student grades, analyze correlation between study hours and scores.", github: "", linkedin: "" },
  { id: 2, name: "Cricket Statistics Analysis", status: "Not Started", progress: 0, startDate: "", endDate: "", notes: "Analyze matches, batsman strike rates, bowler economies, and team performance distributions using NumPy & Pandas.", github: "", linkedin: "" },
  { id: 3, name: "Netflix Dataset Analysis",    status: "Not Started", progress: 0, startDate: "", endDate: "", notes: "Clean and analyze movies/shows data, distribution of content release years, country wise listing distributions.", github: "", linkedin: "" },
  { id: 4, name: "IPL Dataset Analysis",        status: "Not Started", progress: 0, startDate: "", endDate: "", notes: "Build detailed insights on IPL match outcomes, player of the match correlations, and venues using SQL & Pandas.", github: "", linkedin: "" },
  { id: 5, name: "Customer Churn Analysis",     status: "Not Started", progress: 0, startDate: "", endDate: "", notes: "Clean historical telecom customer data, perform EDA, and prepare features for building a churn prediction model.", github: "", linkedin: "" }
];

const DEFAULT_SETTINGS = {
  name: "ML Candidate",
  startDate: new Date().toISOString().split('T')[0],
  targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
  mission: "Become a high-caliber ML Engineer & Secure an Elite Data Science/ML Placement"
};
