import React, { useState } from "react";
import { auth, provider, storage } from "./firebaseConfig";
import { signInWithPopup, signOut } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [coverLetterName, setCoverLetterName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);
  const [coverLetterProgress, setCoverLetterProgress] = useState(0);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      console.log("✅ User signed in:", result.user);
    } catch (error) {
      console.error("❌ Login failed:", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setUser(null);
    setResume(null);
    setCoverLetter(null);
    setResumeName("");
    setCoverLetterName("");
    setResumeProgress(0);
    setCoverLetterProgress(0);
    console.log("✅ User logged out.");
  };

  const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === "resume") {
        setResume(file);
        setResumeName(file.name);
      } else {
        setCoverLetter(file);
        setCoverLetterName(file.name);
      }
    }
  };

  const uploadFile = (file, path, setProgress) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        console.error("❌ No file selected.");
        reject("No file selected");
        return;
      }

      console.log(`📤 Uploading: ${file.name}...`);
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress.toFixed(2));
          console.log(`✅ Upload Progress: ${progress}%`);
        },
        (error) => {
          console.error(`❌ Upload failed for ${file.name}:`, error);
          alert(`Upload failed: ${error.message}`);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`🎉 Uploaded ${file.name}:`, downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error("❌ Error getting download URL:", error);
            reject(error);
          }
        }
      );
    });
  };

  const handleUpload = async () => {
    if (!user) {
      alert("❌ Please sign in before uploading.");
      return;
    }

    if (!resume || !coverLetter) {
      alert("❌ Please select both a Resume and a Cover Letter.");
      return;
    }

    setUploading(true);
    setResumeProgress(0);
    setCoverLetterProgress(0);

    try {
      console.log("📤 Uploading files...");

      const resumePath = `resumes/${user.uid}-${resume.name}`;
      const coverLetterPath = `cover_letters/${user.uid}-${coverLetter.name}`;

      const [resumeURL, coverLetterURL] = await Promise.all([
        uploadFile(resume, resumePath, setResumeProgress),
        uploadFile(coverLetter, coverLetterPath, setCoverLetterProgress),
      ]);

      console.log("✅ Resume URL:", resumeURL);
      console.log("✅ Cover Letter URL:", coverLetterURL);

      alert("🎉 Files uploaded successfully!");

    } catch (error) {
      console.error("❌ Upload failed:", error);
      alert("File upload failed. Please check Firebase Storage settings.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container text-center mt-5">
      {/* Logo & Header */}
      <div className="d-flex justify-content-center align-items-center flex-column">
        <img
          src="https://via.placeholder.com/120" // Replace with actual logo
          alt="Botfolio Logo"
          className="mb-3 rounded-circle shadow"
        />
        <h1 className="fw-bold text-primary">Botfolio</h1>
        <p className="text-muted">Your AI-powered resume chatbot</p>
      </div>

      {!user ? (
        <button className="btn btn-primary btn-lg mt-4 shadow" onClick={handleLogin}>
          Sign in with Google
        </button>
      ) : (
        <div className="mt-4">
          <div className="card shadow-lg p-4">
            <h2 className="text-success">Welcome, {user.displayName} 👋</h2>
            <img
              src={user.photoURL}
              alt="User Profile"
              className="rounded-circle mt-2 shadow"
              width={80}
            />
            <p className="mt-2">{user.email}</p>
            <button className="btn btn-danger mb-3 shadow-sm" onClick={handleLogout}>
              Logout
            </button>

            {/* Resume & Cover Letter Upload */}
            <div className="card p-3 border-0">
              <h4 className="mb-3">Upload Your Resume & Cover Letter</h4>

              {/* Resume Upload */}
              <label className="form-label mt-2">Resume (PDF/DOC/DOCX)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="form-control"
                onChange={(e) => handleFileChange(e, "resume")}
              />
              {resumeName && <p className="text-success mt-1">📄 {resumeName}</p>}

              {/* Upload Progress for Resume */}
              {resumeProgress > 0 && (
                <div className="progress mt-2">
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated bg-info"
                    role="progressbar"
                    style={{ width: `${resumeProgress}%` }}
                  >
                    {resumeProgress}%
                  </div>
                </div>
              )}

              {/* Cover Letter Upload */}
              <label className="form-label mt-3">Cover Letter (PDF/DOC/DOCX)</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="form-control"
                onChange={(e) => handleFileChange(e, "coverLetter")}
              />
              {coverLetterName && <p className="text-success mt-1">📄 {coverLetterName}</p>}

              {/* Upload Progress for Cover Letter */}
              {coverLetterProgress > 0 && (
                <div className="progress mt-2">
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                    role="progressbar"
                    style={{ width: `${coverLetterProgress}%` }}
                  >
                    {coverLetterProgress}%
                  </div>
                </div>
              )}

              <button className="btn btn-success mt-3 shadow-sm" onClick={handleUpload} disabled={uploading}>
                {uploading ? "🚀 Uploading..." : "📤 Upload Files"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
