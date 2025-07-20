-- Additional functions for StudyCollab (user creation trigger already exists)

-- Function to update resource scores based on votes
CREATE OR REPLACE FUNCTION public.update_resource_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.resources
  SET score = (
    SELECT COALESCE(SUM(CASE WHEN type = 'UPVOTE' THEN 1 ELSE -1 END), 0)
    FROM public.votes
    WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)
  ),
  upvotes = (
    SELECT COUNT(*)
    FROM public.votes
    WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)
    AND type = 'UPVOTE'
  ),
  downvotes = (
    SELECT COUNT(*)
    FROM public.votes
    WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)
    AND type = 'DOWNVOTE'
  )
  WHERE id = COALESCE(NEW.resource_id, OLD.resource_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update resource scores when votes change
CREATE TRIGGER on_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_resource_score();

-- Function to prevent users from voting on their own resources
CREATE OR REPLACE FUNCTION public.prevent_self_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.resources
    WHERE id = NEW.resource_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Users cannot vote on their own resources';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to prevent self-voting
CREATE TRIGGER prevent_self_vote_trigger
  BEFORE INSERT OR UPDATE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_vote();