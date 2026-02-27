-- Fix L2 Interview Status Issues
-- This script corrects interviews that should be L2 but are marked as L1

USE xts_InterviewPortal;

-- Find and fix interviews that should be L2 Interview Confirmed (Status 9)
-- These are interviews with Status 8 where the candidate has already completed L1

UPDATE tbl_interview_details i
JOIN mst_candidates c ON i.Candidate_id = c.Candidate_id
SET i.Status_id = 9
WHERE i.Status_id = 8
AND i.Feedback = ''
AND EXISTS (
    SELECT 1 FROM tbl_interview_details i2 
    WHERE i2.Candidate_id = i.Candidate_id 
    AND i2.Status_id IN (1, 2, 3)
    AND i2.Interview_id < i.Interview_id
);

-- Update candidate status to match their latest interview
UPDATE mst_candidates c
JOIN (
    SELECT Candidate_id, Status_id
    FROM tbl_interview_details
    WHERE (Candidate_id, Interview_id) IN (
        SELECT Candidate_id, MAX(Interview_id)
        FROM tbl_interview_details
        WHERE Isactive = 1
        GROUP BY Candidate_id
    )
) latest ON c.Candidate_id = latest.Candidate_id
SET c.Current_status = latest.Status_id;

-- Verify the changes
SELECT 
    c.Candidate_id,
    c.Candidate_name,
    c.Current_status,
    s.Status_description,
    COUNT(CASE WHEN i.Status_id IN (1,2,3) THEN 1 END) as L1_Completed,
    COUNT(CASE WHEN i.Status_id = 8 THEN 1 END) as L1_Scheduled,
    COUNT(CASE WHEN i.Status_id = 9 THEN 1 END) as L2_Scheduled,
    COUNT(CASE WHEN i.Status_id IN (4,5,6) THEN 1 END) as L2_Completed
FROM mst_candidates c
LEFT JOIN mst_application_status s ON c.Current_status = s.Status_id
LEFT JOIN tbl_interview_details i ON c.Candidate_id = i.Candidate_id
WHERE c.Isactive = 1
GROUP BY c.Candidate_id, c.Candidate_name, c.Current_status, s.Status_description
ORDER BY c.Candidate_id DESC;
