import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faSave, faTimes, faCamera, faUpload } from '@fortawesome/free-solid-svg-icons';
import { updateUserDetails, updateUserDetailsAsync } from '../../store/Slices/auth';
import { authService, BACKEND_URL } from '../../services/authService';
import '../Styles/Profile.css';

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: false, message: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // Parse date of birth into day, month, year if available
  const parseDateOfBirth = (dateString) => {
    if (!dateString) return { day: '', month: '', year: '' };

    const parts = dateString.split('/');
    if (parts.length === 3) {
      return {
        day: parts[0],
        month: parts[1],
        year: parts[2]
      };
    }

    return { day: '', month: '', year: '' };
  };

  const dobParts = parseDateOfBirth(user?.dateOfBirth);

  const [editedUser, setEditedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    day: dobParts.day,
    month: dobParts.month,
    year: dobParts.year,
    address: user?.address || '',
    username: user?.username || ''
  });

  // Reset edited user when user changes
  useEffect(() => {
    const dobParts = parseDateOfBirth(user?.dateOfBirth);

    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      day: dobParts.day,
      month: dobParts.month,
      year: dobParts.year,
      address: user?.address || '',
      username: user?.username || ''
    });

    // Get profile picture from user data
    if (user?.profilePicture) {
      // Cloudinary URL is already a full URL, no need to modify
      setPreviewUrl(user.profilePicture);
      console.log('🖼️ Setting profile picture URL:', user.profilePicture);
    }
  }, [user]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async () => {
    if (!selectedFile) {
      setSaveStatus({
        success: false,
        message: 'Please select an image to upload'
      });
      return;
    }

    try {
      setSaveStatus({ success: false, message: 'Uploading profile picture to Cloudinary...' });
      
      const result = await authService.uploadProfilePicture(selectedFile);
      
      if (result.user?.profilePicture) {
        setPreviewUrl(result.user.profilePicture);
        dispatch(updateUserDetails({ profilePicture: result.user.profilePicture }));
      }

      setSaveStatus({
        success: true,
        message: 'Profile picture uploaded to Cloudinary successfully!'
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      setSaveStatus({
        success: false,
        message: `Failed to upload profile picture: ${error.message}`
      });
    }
  };

  // Indian Phone Number Formatting Function
  const formatIndianPhoneNumber = (phoneNumber) => {
    // Return empty string if phoneNumber is undefined or null
    if (!phoneNumber) return '';

    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Limit to 10 digits
    const trimmed = cleaned.slice(0, 10);

    // Return plain format if less than 10 digits
    if (trimmed.length < 10) {
        return trimmed;
    }

    // Return standard 10-digit format without formatting
    return trimmed;
  };

  // Date of Birth validation function
  // eslint-disable-next-line no-unused-vars
  const validateDateFormat = (dateString) => {
    if (!dateString) return true; // Empty is valid

    // Check format DD/MM/YYYY
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    if (!regex.test(dateString)) return false;

    // Extract day, month, year
    const [, day, month, year] = dateString.match(regex);

    // Check month and day validity
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (monthNum < 1 || monthNum > 12) return false;

    // Check days in month
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum < 1 || dayNum > daysInMonth) return false;

    // Check year is reasonable (between 1900 and current year)
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear) return false;

    return true;
  };

  // Function to update dateOfBirth when day, month, or year changes
  const updateDateOfBirth = (field, value) => {
    setEditedUser(prev => {
      const newState = { ...prev, [field]: value };

      // Only update dateOfBirth if all fields have values
      if (newState.day && newState.month && newState.year) {
        newState.dateOfBirth = `${newState.day}/${newState.month}/${newState.year}`;
      } else {
        // If any field is empty, clear dateOfBirth
        newState.dateOfBirth = '';
      }

      return newState;
    });
  };

  const ControlledInput = ({
    label,
    name,
    value,
    onChange,
    type = 'text',
    placeholder,
    formatFunction
  }) => {
    const [inputValue, setInputValue] = useState(value || '');
    const inputRef = useRef(null);
    const [selectionState, setSelectionState] = useState({
      start: 0,
      end: 0
    });
    const [isComposing, setIsComposing] = useState(false);

    useEffect(() => {
      setInputValue(value || '');
    }, [value]);

    const preserveSelection = (input) => {
      if (input && !isComposing) {
        try {
          input.setSelectionRange(
            selectionState.start,
            selectionState.end
          );
        } catch (error) {
          console.error('Selection preservation failed', error);
        }
      }
    };

    const handleChange = (e) => {
      const input = e.target;
      const newValue = input.value;

      // Prevent composition events from interfering
      if (isComposing) return;

      // Capture current selection state
      const currentStart = input.selectionStart;
      const currentEnd = input.selectionEnd;

      // Update input value and selection state
      setInputValue(newValue);
      setSelectionState({
        start: currentStart,
        end: currentEnd
      });

      // Create synthetic event
      const syntheticEvent = {
        target: {
          name: name,
          value: newValue
        }
      };

      // Call parent onChange
      onChange(syntheticEvent);

      // Preserve selection in next render cycle
      requestAnimationFrame(() => {
        if (inputRef.current) {
          preserveSelection(inputRef.current);
        }
      });
    };

    const handleKeyDown = (e) => {
      const input = e.target;
      const { name, value } = input;

      switch (e.key) {
        case 'Backspace':
        case 'Delete': {
          requestAnimationFrame(() => {
            const processedValue = name === 'phone'
              ? value.replace(/\D/g, '').slice(0, 10)
              : value;

            const inputElement = document.getElementsByName(name)[0];
            if (inputElement) {
              inputElement.setSelectionRange(
                processedValue.length,
                processedValue.length
              );

              if (name === 'phone') {
                inputElement.value = formatIndianPhoneNumber(processedValue);
              }
            }
          });
          break;
        }
        case 'ArrowLeft':
        case 'ArrowRight': {
          break;
        }
        default: {
          if (name === 'phone') {
            if (!/^[0-9]$/.test(e.key)) {
              e.preventDefault();
            }
          }
          break;
        }
      }
    };

    const handleFocus = (e) => {
      // Select all text on focus
      e.target.select();

      // Update selection state
      setSelectionState({
        start: 0,
        end: e.target.value.length
      });
    };

    const handleMouseUp = (e) => {
      // Capture selection on mouse up
      setSelectionState({
        start: e.target.selectionStart,
        end: e.target.selectionEnd
      });
    };

    const handleCompositionStart = () => {
      setIsComposing(true);
    };

    const handleCompositionEnd = (e) => {
      setIsComposing(false);
      handleChange(e);
    };

    return (
      <div className="mb-3">
        <label className="form-label">{label}</label>
        <input
          ref={inputRef}
          type={type}
          className="form-control"
          name={name}
          value={formatFunction ? formatFunction(inputValue) : inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onMouseUp={handleMouseUp}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    );
  };

  const handleInputChange = (e) => {
    const input = e.target;
    const { name, value } = input;

    // Process value based on input type
    let processedValue;

    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'dateOfBirth') {
      // Auto-format date as user types
      // eslint-disable-next-line no-useless-escape
      const cleaned = value.replace(/[^\d\/]/g, '');

      // Apply DD/MM/YYYY format automatically
      if (cleaned.length <= 2) {
        processedValue = cleaned;
      } else if (cleaned.length <= 5) {
        const day = cleaned.substring(0, 2);
        const rest = cleaned.substring(2).replace(/^\//, '');
        processedValue = `${day}/${rest}`;
      } else {
        const day = cleaned.substring(0, 2);
        const month = cleaned.substring(2, 4).replace(/^\//, '');
        const year = cleaned.substring(4).replace(/^\//, '');
        processedValue = `${day}/${month}/${year}`;
      }
    } else {
      processedValue = value;
    }

    // Update user state
    setEditedUser((prev) => ({
        ...prev,
        [name]: processedValue
    }));

    // Advanced cursor preservation
    requestAnimationFrame(() => {
        const inputElement = document.getElementsByName(name)[0];
        if (inputElement) {
            try {
                inputElement.focus();

                // Always place cursor at the end after input
                const newCursorPosition = processedValue.length;

                inputElement.setSelectionRange(
                    newCursorPosition,
                    newCursorPosition
                );

                // Update display with formatted number
                if (name === 'phone') {
                    inputElement.value = formatIndianPhoneNumber(processedValue);
                }
            } catch (error) {
                console.error('Cursor preservation failed', error);
            }
        }
    });
  };

  const handleSave = async () => {
    try {
      // Clear any previous status messages
      setSaveStatus({ success: false, message: 'Saving changes...' });

      // Validate date of birth if any of the fields are provided
      if ((editedUser.day || editedUser.month || editedUser.year) &&
          !(editedUser.day && editedUser.month && editedUser.year)) {
        setSaveStatus({
          success: false,
          message: 'Please complete all date of birth fields (day, month, and year)'
        });
        return;
      }

      // First update the local state for immediate UI feedback
      dispatch(updateUserDetails(editedUser));

      // Then send the update to the backend
      const result = await dispatch(updateUserDetailsAsync(editedUser)).unwrap();

      // Show success message
      let successMessage = 'Profile updated successfully!';

      // Check if it was a local-only update
      if (result.message && result.message.includes('local only')) {
        successMessage = 'Profile updated successfully! (Changes stored locally)';
      } else {
        successMessage = 'Profile updated successfully! Your details have been saved to the database.';
      }

      setSaveStatus({
        success: true,
        message: successMessage
      });

      console.log('✅ Profile updated successfully:', result);

      // Log the profile picture path if available
      if (result.user && result.user.profilePicture) {
        console.log('📸 Profile picture path in database:', result.user.profilePicture);
      }

      // Close the editing mode after a short delay to show the success message
      setTimeout(() => {
        setIsEditing(false);
        // Clear the success message after closing edit mode
        setSaveStatus({ success: false, message: '' });
      }, 2000);
    } catch (error) {
      console.error('Failed to update user details:', error);

      // Show error message with login prompt if it's an authentication error
      if (error.message && error.message.includes('Authentication failed')) {
        setSaveStatus({
          success: false,
          message: `${error.message} Please try logging out and logging back in.`
        });
      } else {
        // Show generic error message
        setSaveStatus({
          success: false,
          message: `Failed to update profile: ${error}`
        });
      }
    }
  };

  const handleCancel = () => {
    // Reset to original user details
    const dobParts = parseDateOfBirth(user?.dateOfBirth);

    setEditedUser({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      day: dobParts.day,
      month: dobParts.month,
      year: dobParts.year,
      address: user?.address || '',
      username: user?.username || ''
    });
    setIsEditing(false);
  };

  // Show loading spinner when loading
  if (loading && !user) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-10 text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h3 className="mt-3">Loading your profile...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h2>User Profile</h2>
              {!isEditing ? (
                <button
                  className="btn btn-light"
                  onClick={() => setIsEditing(true)}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faEdit} className="me-2" />
                  Edit Profile
                </button>
              ) : (
                <div>
                  <button
                    className="btn btn-success me-2"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faTimes} className="me-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            <div className="card-body">
              {/* Status Messages */}
              {saveStatus.message && (
                <div className={`alert ${saveStatus.success ? 'alert-success' : 'alert-danger'} mb-3`} role="alert">
                  {saveStatus.message}
                </div>
              )}

              {/* Error from Redux state */}
              {error && !saveStatus.message && (
                <div className="alert alert-danger mb-3" role="alert">
                  {error}
                </div>
              )}

              {user ? (
                <div className="row">
                  <div className="col-md-4 text-center">
                    <div className="profile-picture-container">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Profile"
                          className="profile-picture"
                        />
                      ) : (
                        <div className="profile-picture-placeholder">
                          <FontAwesomeIcon
                            icon={faUser}
                            style={{
                              fontSize: '5rem',
                              color: '#6c757d'
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="profile-image-actions">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="d-none"
                          id="profile-picture-input"
                        />
                        <label
                          htmlFor="profile-picture-input"
                          className="btn btn-outline-primary btn-sm mb-2"
                        >
                          <FontAwesomeIcon icon={faCamera} className="me-1" />
                          Select Image
                        </label>
                        {selectedFile && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={handleProfilePictureUpload}
                            disabled={loading}
                          >
                            {loading ? (
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            ) : (
                              <FontAwesomeIcon icon={faUpload} className="me-1" />
                            )}
                            Set as Profile Picture
                          </button>
                        )}
                      </div>
                    )}
                    <div className="profile-info mt-4">
                      <h3 className="mb-2">{user.name}</h3>
                      <p className="text-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="col-md-8">
                    {isEditing ? (
                      <form autoComplete="off">
                        <div className="row">
                          <div className="col-md-6">
                            <ControlledInput
                              label="Full Name"
                              name="name"
                              value={editedUser.name}
                              onChange={handleInputChange}
                              placeholder="Enter your full name"
                            />
                          </div>
                          <div className="col-md-6">
                            <ControlledInput
                              label="Email"
                              name="email"
                              type="email"
                              value={editedUser.email}
                              onChange={handleInputChange}
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <ControlledInput
                              label="Phone"
                              name="phone"
                              value={editedUser.phone}
                              onChange={handleInputChange}
                              placeholder="Enter your phone number"
                              formatFunction={formatIndianPhoneNumber}
                            />
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Date of Birth</label>
                              <div className="row g-2">
                                {/* Day dropdown */}
                                <div className="col-4">
                                  <select
                                    className="form-select"
                                    value={editedUser.day}
                                    onChange={(e) => updateDateOfBirth('day', e.target.value)}
                                  >
                                    <option value="">Day</option>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                      <option key={day} value={day}>{day}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Month dropdown */}
                                <div className="col-4">
                                  <select
                                    className="form-select"
                                    value={editedUser.month}
                                    onChange={(e) => updateDateOfBirth('month', e.target.value)}
                                  >
                                    <option value="">Month</option>
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                  </select>
                                </div>

                                {/* Year dropdown */}
                                <div className="col-4">
                                  <select
                                    className="form-select"
                                    value={editedUser.year}
                                    onChange={(e) => updateDateOfBirth('year', e.target.value)}
                                  >
                                    <option value="">Year</option>
                                    {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                      <option key={year} value={year}>{year}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <small className="text-muted">Select your date of birth</small>
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <ControlledInput
                              label="Address"
                              name="address"
                              value={editedUser.address}
                              onChange={handleInputChange}
                              placeholder="Enter your address"
                            />
                          </div>
                          <div className="col-md-6">
                            <ControlledInput
                              label="Username"
                              name="username"
                              value={editedUser.username}
                              onChange={handleInputChange}
                              placeholder="Enter your username"
                            />
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Full Name:</strong></div>
                          <div className="col-8">{user.name || 'Not provided'}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Email:</strong></div>
                          <div className="col-8">{user.email || 'Not provided'}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Phone:</strong></div>
                          <div className="col-8">{formatIndianPhoneNumber(user.phone) || 'Not provided'}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Date of Birth:</strong></div>
                          <div className="col-8">{user.dateOfBirth || 'Not provided'}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Address:</strong></div>
                          <div className="col-8">{user.address || 'Not provided'}</div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-4 text-end"><strong>Username:</strong></div>
                          <div className="col-8">{user.username || 'Not provided'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="rounded-circle mx-auto mb-4" style={{
                    width: '150px',
                    height: '150px',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FontAwesomeIcon
                      icon={faUser}
                      style={{
                        fontSize: '5rem',
                        color: '#6c757d'
                      }}
                    />
                  </div>
                  <p className="text-muted">No user logged in</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
