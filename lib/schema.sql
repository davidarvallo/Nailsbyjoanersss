CREATE TABLE IF NOT EXISTS booking_settings (id integer PRIMARY KEY CHECK (id=1), data jsonb NOT NULL DEFAULT '{}'::jsonb);
INSERT INTO booking_settings(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS bookings (
 id text PRIMARY KEY, token_hash text NOT NULL UNIQUE,
 start_at timestamptz NOT NULL, end_at timestamptz NOT NULL CHECK(end_at>start_at),
 expires_at timestamptz NOT NULL, status text NOT NULL CHECK(status IN ('pending','confirmed','declined','canceled','expired','blocked')),
 deposit_verified boolean NOT NULL DEFAULT false, data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_calendar ON bookings(start_at,end_at);
CREATE TABLE IF NOT EXISTS booking_rate_limits (key text PRIMARY KEY, hits integer NOT NULL, reset_at timestamptz NOT NULL);
CREATE OR REPLACE FUNCTION reserve_booking(p_id text,p_token text,p_start timestamptz,p_end timestamptz,p_expiry timestamptz,p_data jsonb,p_block boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
 LOCK TABLE bookings IN EXCLUSIVE MODE;
 UPDATE bookings SET status='expired',updated_at=now() WHERE status='pending' AND expires_at<=now();
 IF EXISTS (SELECT 1 FROM bookings WHERE status IN ('pending','confirmed','blocked') AND start_at<p_end AND end_at>p_start) THEN RETURN 'conflict'; END IF;
 INSERT INTO bookings(id,token_hash,start_at,end_at,expires_at,status,data) VALUES(p_id,p_token,p_start,p_end,p_expiry,CASE WHEN p_block THEN 'blocked' ELSE 'pending' END,p_data);
 RETURN 'ok';
END $$;
CREATE OR REPLACE FUNCTION manage_booking(p_id text,p_action text,p_start timestamptz DEFAULT NULL,p_end timestamptz DEFAULT NULL,p_location text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE b bookings%ROWTYPE;
BEGIN
 LOCK TABLE bookings IN EXCLUSIVE MODE;
 UPDATE bookings SET status='expired',updated_at=now() WHERE status='pending' AND expires_at<=now();
 SELECT * INTO b FROM bookings WHERE id=p_id;
 IF NOT FOUND THEN RETURN 'missing'; END IF;
 IF p_action='confirm' THEN
  IF b.status<>'pending' THEN RETURN 'invalid'; END IF;
  UPDATE bookings SET status='confirmed',deposit_verified=true,updated_at=now() WHERE id=p_id;
 ELSIF p_action IN ('decline','cancel') THEN
  IF b.status NOT IN ('pending','confirmed','blocked') THEN RETURN 'invalid'; END IF;
  UPDATE bookings SET status=CASE WHEN p_action='decline' THEN 'declined' ELSE 'canceled' END,updated_at=now() WHERE id=p_id;
 ELSIF p_action='reschedule' THEN
  IF b.status NOT IN ('pending','confirmed') OR p_start IS NULL OR p_end IS NULL OR p_end<=p_start THEN RETURN 'invalid'; END IF;
  IF EXISTS(SELECT 1 FROM bookings WHERE id<>p_id AND status IN ('pending','confirmed','blocked') AND start_at<p_end AND end_at>p_start) THEN RETURN 'conflict'; END IF;
  UPDATE bookings SET start_at=p_start,end_at=p_end,data=jsonb_set(data,'{location}',to_jsonb(p_location)),updated_at=now() WHERE id=p_id;
 ELSE RETURN 'invalid'; END IF;
 RETURN 'ok';
END $$;
