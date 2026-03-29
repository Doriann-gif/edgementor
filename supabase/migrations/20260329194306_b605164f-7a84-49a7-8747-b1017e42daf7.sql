-- Allow admins to delete mentors
CREATE POLICY "Admins can delete mentors"
ON public.mentors
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete mentor content when deleting a mentor
CREATE POLICY "Admins can delete mentor content"
ON public.mentor_content
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all profiles for student management
CREATE POLICY "Admins can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));