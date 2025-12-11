// ----------------------
// CORS CONFIG (TEMPORARY TEST - INSECURE FOR PRODUCTION)
// ----------------------
app.use(
  cors({
    origin: '*', // Allow all origins for testing
    credentials: true, // This should be FALSE with '*', but we keep it to test the full stack
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.options('*', cors()); // Ensure preflight is handled globally
// ----------------------