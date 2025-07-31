-- File Storage Functions (Run this after the main migration)

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_file_download_count()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.action = 'DOWNLOAD' THEN
    UPDATE public.files
    SET download_count = download_count + 1
    WHERE id = NEW.file_id;
    
    -- Also increment share download count if accessed via share
    IF NEW.share_token IS NOT NULL THEN
      UPDATE public.file_shares
      SET download_count = download_count + 1
      WHERE share_token = NEW.share_token;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to increment download counts
CREATE TRIGGER on_file_access_log
  AFTER INSERT ON public.file_access_logs
  FOR EACH ROW EXECUTE FUNCTION public.increment_file_download_count();

-- Function to clean up expired shares
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.file_shares
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$;