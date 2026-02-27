-- Fix Foreign Key Constraints to allow CASCADE DELETE
-- This allows deleting candidates and their related interview records

USE xts_InterviewPortal;

-- Drop the existing foreign key constraint
ALTER TABLE tbl_interview_details 
DROP FOREIGN KEY tbl_interview_details_ibfk_4;

-- Add the foreign key constraint with CASCADE DELETE
ALTER TABLE tbl_interview_details 
ADD CONSTRAINT tbl_interview_details_ibfk_4 
FOREIGN KEY (Candidate_id) 
REFERENCES mst_candidates(Candidate_id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Verify the change
SHOW CREATE TABLE tbl_interview_details;
