-- TRIGGER to start workId from 1 for each new project.
CREATE OR REPLACE FUNCTION assign_work_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW."workId" IS NULL THEN
        SELECT
            COALESCE(MAX("workId"), 0) + 1
        INTO 
            NEW."workId"
        FROM
            "work"
        WHERE
            "projectId" = NEW."projectId";
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--- Attach trigger
CREATE TRIGGER set_work_id
BEFORE INSERT ON "work"
FOR EACH ROW
EXECUTE FUNCTION assign_work_id();