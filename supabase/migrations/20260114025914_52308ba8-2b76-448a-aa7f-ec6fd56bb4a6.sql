-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create reading_list table for saving academic papers
CREATE TABLE public.reading_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  paper_id TEXT NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[] NOT NULL DEFAULT '{}',
  abstract TEXT,
  url TEXT NOT NULL,
  pdf_url TEXT,
  source TEXT NOT NULL,
  published_date TEXT,
  journal TEXT,
  doi TEXT,
  notes TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  highlight_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, paper_id)
);

-- Enable Row Level Security
ALTER TABLE public.reading_list ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own reading list" 
ON public.reading_list 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their reading list" 
ON public.reading_list 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reading list items" 
ON public.reading_list 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their reading list" 
ON public.reading_list 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reading_list_updated_at
BEFORE UPDATE ON public.reading_list
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();