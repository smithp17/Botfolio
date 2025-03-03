import React, { useState } from "react";
import { auth, provider, storage } from "./firebaseConfig";
import { signInWithPopup, signOut } from "firebase/auth";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [user, setUser] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [resumeProgress, setResumeProgress] = useState([]);
  const [coverLetterProgress, setCoverLetterProgress] = useState([]);

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
    setResumes([]);
    setCoverLetters([]);
    setResumeProgress([]);
    setCoverLetterProgress([]);
    console.log("✅ User logged out.");
  };

  const handleFileChange = (event, type) => {
    const files = Array.from(event.target.files).slice(0, 3); // Allow up to 3 files per selection
    if (files.length > 0) {
      if (type === "resume") {
        // Append new files to the existing resumes, ensuring the total does not exceed 3
        const updatedResumes = [...resumes, ...files].slice(0, 3);
        setResumes(updatedResumes);
        setResumeProgress(new Array(updatedResumes.length).fill(0));
      } else {
        // Append new files to the existing cover letters, ensuring the total does not exceed 3
        const updatedCoverLetters = [...coverLetters, ...files].slice(0, 3);
        setCoverLetters(updatedCoverLetters);
        setCoverLetterProgress(new Array(updatedCoverLetters.length).fill(0));
      }
    }
  };

  const uploadFile = (file, path, setProgress, index) => {
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
          setProgress((prev) => {
            const newProgress = [...prev];
            newProgress[index] = progress.toFixed(2);
            return newProgress;
          });
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
  
    if (resumes.length === 0 || coverLetters.length === 0) {
      alert("❌ Please select at least one Resume and one Cover Letter.");
      return;
    }
  
    setUploading(true);
    setResumeProgress(new Array(resumes.length).fill(0));
    setCoverLetterProgress(new Array(coverLetters.length).fill(0));
  
    try {
      console.log("📤 Uploading files...");
  
      // Define file paths for resumes and cover letters
      const resumePaths = resumes.map(
        (resume) => `resumes/${user.uid}/${resume.name}`
      );
      const coverLetterPaths = coverLetters.map(
        (coverLetter) => `cover_letters/${user.uid}/${coverLetter.name}`
      );
  
      // Upload all resumes and cover letters in parallel
      const resumeURLs = await Promise.all(
        resumes.map((resume, index) =>
          uploadFile(resume, resumePaths[index], setResumeProgress, index)
        )
      ); // ✅ Closing parenthesis added
  
      const coverLetterURLs = await Promise.all(
        coverLetters.map((coverLetter, index) =>
          uploadFile(coverLetter, coverLetterPaths[index], setCoverLetterProgress, index)
        )
      ); // ✅ Closing parenthesis added
  
      console.log("✅ Resume URLs:", resumeURLs);
      console.log("✅ Cover Letter URLs:", coverLetterURLs);
  
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
              <label className="form-label mt-2">Resumes (PDF/DOC/DOCX) - Max 3</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="form-control"
                onChange={(e) => handleFileChange(e, "resume")}
                multiple
              />
              {resumes.length > 0 && (
                <div className="mt-2">
                  <h6>Selected Resumes:</h6>
                  <ul className="list-group">
                    {resumes.map((resume, index) => (
                      <li key={index} className="list-group-item">
                        📄 {resume.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upload Progress for Resumes */}
              {resumeProgress.map((progress, index) => (
                progress > 0 && (
                  <div key={index} className="progress mt-2">
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated bg-info"
                      role="progressbar"
                      style={{ width: `${progress}%` }}
                    >
                      {progress}%
                    </div>
                  </div>
                )
              ))}

              {/* Cover Letter Upload */}
              <label className="form-label mt-3">Cover Letters (PDF/DOC/DOCX) - Max 3</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="form-control"
                onChange={(e) => handleFileChange(e, "coverLetter")}
                multiple
              />
              {coverLetters.length > 0 && (
                <div className="mt-2">
                  <h6>Selected Cover Letters:</h6>
                  <ul className="list-group">
                    {coverLetters.map((coverLetter, index) => (
                      <li key={index} className="list-group-item">
                        📄 {coverLetter.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upload Progress for Cover Letters */}
              {coverLetterProgress.map((progress, index) => (
                progress > 0 && (
                  <div key={index} className="progress mt-2">
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                      role="progressbar"
                      style={{ width: `${progress}%` }}
                    >
                      {progress}%
                    </div>
                  </div>
                )
              ))}

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