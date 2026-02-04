-- Allow any authenticated user to create collection events
CREATE POLICY "Authenticated users can create events" 
ON public.collection_events 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own events
CREATE POLICY "Users can update their own events" 
ON public.collection_events 
FOR UPDATE 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own events
CREATE POLICY "Users can delete their own events" 
ON public.collection_events 
FOR DELETE 
USING (created_by = auth.uid());